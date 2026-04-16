from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import base64

import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    bio: str = ""
    level: int = 1
    points: int = 0
    streak: int = 0
    reputation: int = 0
    badges: List[str] = []
    joined_challenges: List[str] = []
    challenges_won: int = 0
    challenges_lost: int = 0
    total_earnings: float = 0
    friends: List[str] = []
    referral_code: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Challenge(BaseModel):
    challenge_id: str = Field(default_factory=lambda: f"challenge_{uuid.uuid4().hex[:12]}")
    title: str
    description: str
    category: str  # Sport, Business, Argent, Discipline, Santé, Social, Général
    duration_days: int
    difficulty: str = "moyen"  # facile, moyen, hardcore
    validation_type: str = "manual"  # manual, photo, video, auto
    location: str = "monde"  # ville, pays, monde
    is_public: bool = True
    challenge_type: str = "community"  # "community", "friends", "solo", "random"
    invite_code: Optional[str] = None
    creator_id: str
    creator_name: str
    participants: List[str] = []
    participant_count: int = 0
    max_participants: int = 0  # 0 = unlimited
    # Pot system (simulated MVP)
    has_pot: bool = False
    pot_amount_per_person: float = 0
    pot_total: float = 0
    pot_contributions: List[str] = []
    winner_id: Optional[str] = None
    winner_name: Optional[str] = None
    platform_commission: float = 0  # 10% of pot
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    image: Optional[str] = None

class ChallengeCreate(BaseModel):
    title: str
    description: str
    category: str
    duration_days: int
    difficulty: str = "moyen"
    validation_type: str = "manual"
    location: str = "monde"
    is_public: bool = True
    challenge_type: str = "community"
    has_pot: bool = False
    pot_amount_per_person: float = 0
    max_participants: int = 0
    image: Optional[str] = None

class UserChallenge(BaseModel):
    user_challenge_id: str = Field(default_factory=lambda: f"uc_{uuid.uuid4().hex[:12]}")
    user_id: str
    challenge_id: str
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    current_day: int = 1
    completed_days: int = 0
    is_completed: bool = False
    proofs: List[str] = []

class Proof(BaseModel):
    proof_id: str = Field(default_factory=lambda: f"proof_{uuid.uuid4().hex[:12]}")
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    challenge_id: str
    challenge_title: str
    image: Optional[str] = None  # Base64 encoded or URL
    media_url: Optional[str] = None  # URL for uploaded video/image files
    media_type: str = "text"  # text, image, video
    text: str
    day_number: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    likes: int = 0
    liked_by: List[str] = []

class ProofCreate(BaseModel):
    challenge_id: str
    image: Optional[str] = None
    text: str
    media_type: str = "text"

class Badge(BaseModel):
    badge_id: str
    name: str
    description: str
    icon: str
    required_points: int = 0
    required_streak: int = 0
    required_challenges: int = 0

# Default badges
DEFAULT_BADGES = [
    {"badge_id": "first_challenge", "name": "Premier Défi", "description": "Rejoindre votre premier défi", "icon": "star", "required_challenges": 1},
    {"badge_id": "streak_7", "name": "Semaine de Feu", "description": "7 jours de streak", "icon": "flame", "required_streak": 7},
    {"badge_id": "streak_30", "name": "Mois de Fer", "description": "30 jours de streak", "icon": "trophy", "required_streak": 30},
    {"badge_id": "points_100", "name": "Centurion", "description": "Atteindre 100 points", "icon": "medal", "required_points": 100},
    {"badge_id": "points_500", "name": "Champion", "description": "Atteindre 500 points", "icon": "crown", "required_points": 500},
    {"badge_id": "challenger_5", "name": "Challenger", "description": "Compléter 5 défis", "icon": "award", "required_challenges": 5},
]

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Get current user from session token in cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_optional_user(request: Request) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            if auth_response.status_code != 200:
                logger.error(f"Auth error: {auth_response.text}")
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = auth_response.json()
        except httpx.RequestError as e:
            logger.error(f"Auth request error: {e}")
            raise HTTPException(status_code=500, detail="Auth service unavailable")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = User(
            user_id=user_id,
            email=email,
            name=name,
            picture=picture
        )
        await db.users.insert_one(new_user.dict())
        # Award first badge opportunity
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.delete_many({"user_id": user_id})  # Remove old sessions
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.dict()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== USER ROUTES ====================

@api_router.get("/users/me")
async def get_user_profile(user: User = Depends(get_current_user)):
    """Get current user's full profile"""
    return user.dict()

@api_router.get("/users/search")
async def search_users(q: str, user: User = Depends(get_current_user)):
    """Search users by name"""
    if len(q) < 1:
        return []
    users = await db.users.find(
        {"name": {"$regex": q, "$options": "i"}, "user_id": {"$ne": user.user_id}},
        {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "level": 1, "points": 1, "badges": 1, "streak": 1}
    ).limit(15).to_list(15)
    
    # Add friendship status
    user_friends = user.friends or []
    sent_requests = await db.friend_requests.find(
        {"from_id": user.user_id, "status": "pending"},
        {"_id": 0, "to_id": 1}
    ).to_list(100)
    sent_ids = [r["to_id"] for r in sent_requests]
    
    for u in users:
        u["is_friend"] = u["user_id"] in user_friends
        u["request_sent"] = u["user_id"] in sent_ids
    
    return users

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get a user's public profile"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Return only public info
    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "picture": user.get("picture"),
        "level": user.get("level", 1),
        "points": user.get("points", 0),
        "streak": user.get("streak", 0),
        "reputation": user.get("reputation", 0),
        "badges": user.get("badges", [])
    }

@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get global leaderboard"""
    users = await db.users.find({}, {"_id": 0}).sort("points", -1).limit(limit).to_list(limit)
    return [
        {
            "user_id": u["user_id"],
            "name": u["name"],
            "picture": u.get("picture"),
            "level": u.get("level", 1),
            "points": u.get("points", 0),
            "streak": u.get("streak", 0),
            "badges": u.get("badges", []),
            "challenges_won": u.get("challenges_won", 0),
            "total_earnings": u.get("total_earnings", 0),
        }
        for u in users
    ]

# ==================== CHALLENGE ROUTES ====================

@api_router.post("/challenges")
async def create_challenge(challenge_data: ChallengeCreate, user: User = Depends(get_current_user)):
    """Create a new challenge"""
    invite_code = generate_invite_code() if challenge_data.challenge_type == "friends" else None
    is_public = challenge_data.challenge_type == "community"
    
    challenge = Challenge(
        title=challenge_data.title,
        description=challenge_data.description,
        category=challenge_data.category,
        duration_days=challenge_data.duration_days,
        difficulty=challenge_data.difficulty,
        validation_type=challenge_data.validation_type,
        location=challenge_data.location,
        is_public=is_public,
        challenge_type=challenge_data.challenge_type,
        invite_code=invite_code,
        creator_id=user.user_id,
        creator_name=user.name,
        has_pot=challenge_data.has_pot,
        pot_amount_per_person=challenge_data.pot_amount_per_person,
        platform_commission=challenge_data.pot_amount_per_person * 0.1 if challenge_data.has_pot else 0,
        max_participants=challenge_data.max_participants,
        image=challenge_data.image
    )
    await db.challenges.insert_one(challenge.dict())
    return challenge.dict()

@api_router.get("/challenges")
async def get_challenges(category: Optional[str] = None, limit: int = 20):
    """Get public challenges"""
    query = {"is_public": True}
    if category:
        query["category"] = category
    
    challenges = await db.challenges.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return challenges

@api_router.get("/challenges/trending")
async def get_trending_challenges(limit: int = 10):
    """Get trending challenges (most participants)"""
    challenges = await db.challenges.find(
        {"is_public": True}, 
        {"_id": 0}
    ).sort("participant_count", -1).limit(limit).to_list(limit)
    return challenges

@api_router.get("/challenges/{challenge_id}")
async def get_challenge(challenge_id: str):
    """Get challenge details"""
    challenge = await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

# ==================== SOCIAL / INVITE ROUTES ====================

@api_router.get("/challenges/code/{invite_code}")
async def get_challenge_by_code(invite_code: str):
    """Get challenge by invite code"""
    challenge = await db.challenges.find_one({"invite_code": invite_code.upper()}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Code invalide")
    return challenge

@api_router.post("/challenges/join-by-code")
async def join_by_code(request: Request, user: User = Depends(get_current_user)):
    """Join a challenge via invite code"""
    body = await request.json()
    code = body.get("code", "").upper()
    if not code:
        raise HTTPException(status_code=400, detail="Code requis")
    
    challenge = await db.challenges.find_one({"invite_code": code}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Code invalide")
    
    # Check if already joined
    existing = await db.user_challenges.find_one({
        "user_id": user.user_id, "challenge_id": challenge["challenge_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Déjà inscrit à ce défi")
    
    # Join
    uc = UserChallenge(user_id=user.user_id, challenge_id=challenge["challenge_id"])
    await db.user_challenges.insert_one(uc.dict())
    await db.challenges.update_one(
        {"challenge_id": challenge["challenge_id"]},
        {"$push": {"participants": user.user_id}, "$inc": {"participant_count": 1}}
    )
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$push": {"joined_challenges": challenge["challenge_id"]}}
    )
    await update_user_points(user.user_id, 5)
    await check_and_award_badges(user.user_id)
    return {"message": "Défi rejoint avec succès", "challenge": challenge}

@api_router.post("/challenges/{challenge_id}/contribute-pot")
async def contribute_pot(challenge_id: str, user: User = Depends(get_current_user)):
    """Contribute to the challenge pot (simulated)"""
    challenge = await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not challenge.get("has_pot"):
        raise HTTPException(status_code=400, detail="Ce défi n'a pas de cagnotte")
    if user.user_id in challenge.get("pot_contributions", []):
        raise HTTPException(status_code=400, detail="Vous avez déjà contribué")
    
    # Check user joined
    existing = await db.user_challenges.find_one({
        "user_id": user.user_id, "challenge_id": challenge_id
    })
    if not existing:
        raise HTTPException(status_code=400, detail="Vous n'avez pas rejoint ce défi")
    
    amount = challenge.get("pot_amount_per_person", 0)
    await db.challenges.update_one(
        {"challenge_id": challenge_id},
        {
            "$push": {"pot_contributions": user.user_id},
            "$inc": {"pot_total": amount}
        }
    )
    return {"message": f"Contribution de {amount}€ ajoutée", "new_total": challenge.get("pot_total", 0) + amount}

@api_router.get("/my-friends-challenges")
async def get_my_friends_challenges(user: User = Depends(get_current_user)):
    """Get private/friends challenges the user is in or was invited to"""
    joined_ids = user.joined_challenges or []
    challenges = await db.challenges.find(
        {"$or": [
            {"challenge_type": "friends", "creator_id": user.user_id},
            {"challenge_type": "friends", "challenge_id": {"$in": joined_ids}},
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return challenges

# ==================== FRIEND SYSTEM (REQUEST-BASED) ====================

@api_router.post("/friends/request")
async def send_friend_request(request: Request, user: User = Depends(get_current_user)):
    """Send a friend request"""
    body = await request.json()
    to_id = body.get("to_id")
    if not to_id or to_id == user.user_id:
        raise HTTPException(status_code=400, detail="ID invalide")
    
    target = await db.users.find_one({"user_id": to_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    # Already friends?
    if to_id in (user.friends or []):
        raise HTTPException(status_code=400, detail="Deja ami")
    
    # Existing pending request?
    existing = await db.friend_requests.find_one({
        "$or": [
            {"from_id": user.user_id, "to_id": to_id, "status": "pending"},
            {"from_id": to_id, "to_id": user.user_id, "status": "pending"},
        ]
    })
    if existing:
        # If they already sent us a request, auto-accept
        if existing["from_id"] == to_id:
            await db.friend_requests.update_one(
                {"request_id": existing["request_id"]},
                {"$set": {"status": "accepted"}}
            )
            await db.users.update_one({"user_id": user.user_id}, {"$addToSet": {"friends": to_id}})
            await db.users.update_one({"user_id": to_id}, {"$addToSet": {"friends": user.user_id}})
            await _create_notification(to_id, "friend_accepted", f"{user.name} a accepte ta demande", {"user_id": user.user_id})
            return {"message": "Vous etes maintenant amis !", "status": "accepted"}
        raise HTTPException(status_code=400, detail="Demande deja envoyee")
    
    req_id = f"freq_{uuid.uuid4().hex[:12]}"
    await db.friend_requests.insert_one({
        "request_id": req_id,
        "from_id": user.user_id,
        "from_name": user.name,
        "from_picture": user.picture,
        "to_id": to_id,
        "to_name": target.get("name", ""),
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    })
    
    await _create_notification(to_id, "friend_request", f"{user.name} veut etre ton ami", {"user_id": user.user_id, "request_id": req_id})
    return {"message": f"Demande envoyee a {target.get('name')}", "request_id": req_id}

@api_router.get("/friends/requests")
async def get_friend_requests(user: User = Depends(get_current_user)):
    """Get pending friend requests received"""
    requests = await db.friend_requests.find(
        {"to_id": user.user_id, "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return requests

@api_router.get("/friends/requests/sent")
async def get_sent_requests(user: User = Depends(get_current_user)):
    """Get friend requests sent by user"""
    requests = await db.friend_requests.find(
        {"from_id": user.user_id, "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [r["to_id"] for r in requests]

@api_router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, user: User = Depends(get_current_user)):
    """Accept a friend request"""
    req = await db.friend_requests.find_one({"request_id": request_id, "to_id": user.user_id, "status": "pending"}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    
    await db.friend_requests.update_one({"request_id": request_id}, {"$set": {"status": "accepted"}})
    await db.users.update_one({"user_id": user.user_id}, {"$addToSet": {"friends": req["from_id"]}})
    await db.users.update_one({"user_id": req["from_id"]}, {"$addToSet": {"friends": user.user_id}})
    
    await _create_notification(req["from_id"], "friend_accepted", f"{user.name} a accepte ta demande", {"user_id": user.user_id})
    return {"message": f"Vous etes maintenant amis avec {req.get('from_name', '')}"}

@api_router.post("/friends/decline/{request_id}")
async def decline_friend_request(request_id: str, user: User = Depends(get_current_user)):
    """Decline a friend request"""
    req = await db.friend_requests.find_one({"request_id": request_id, "to_id": user.user_id, "status": "pending"}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    
    await db.friend_requests.update_one({"request_id": request_id}, {"$set": {"status": "declined"}})
    return {"message": "Demande refusee"}

@api_router.post("/friends/add")
async def add_friend(request: Request, user: User = Depends(get_current_user)):
    """Legacy: Add a friend directly (kept for backward compat, now sends request)"""
    body = await request.json()
    friend_id = body.get("friend_id")
    if not friend_id or friend_id == user.user_id:
        raise HTTPException(status_code=400, detail="ID invalide")
    
    friend = await db.users.find_one({"user_id": friend_id}, {"_id": 0})
    if not friend:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    if friend_id in (user.friends or []):
        raise HTTPException(status_code=400, detail="Deja ami")
    
    # Add mutual friendship
    await db.users.update_one({"user_id": user.user_id}, {"$addToSet": {"friends": friend_id}})
    await db.users.update_one({"user_id": friend_id}, {"$addToSet": {"friends": user.user_id}})
    return {"message": f"Ami ajoute : {friend.get('name')}"}

@api_router.get("/friends")
async def get_friends(user: User = Depends(get_current_user)):
    """Get user's friends list"""
    friend_ids = user.friends or []
    if not friend_ids:
        return []
    friends = await db.users.find(
        {"user_id": {"$in": friend_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "level": 1, "points": 1, "streak": 1, "badges": 1}
    ).to_list(100)
    return friends

@api_router.get("/friends/leaderboard")
async def get_friends_leaderboard(user: User = Depends(get_current_user)):
    """Get leaderboard of friends only"""
    friend_ids = (user.friends or []) + [user.user_id]
    friends = await db.users.find(
        {"user_id": {"$in": friend_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "level": 1, "points": 1, "streak": 1}
    ).sort("points", -1).to_list(50)
    return friends

# ==================== NOTIFICATIONS ====================

async def _create_notification(user_id: str, ntype: str, text: str, data: dict = None):
    """Helper to create a notification"""
    notif = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": ntype,
        "text": text,
        "data": data or {},
        "read": False,
        "created_at": datetime.now(timezone.utc),
    }
    await db.notifications.insert_one(notif)

@api_router.get("/notifications")
async def get_notifications(user: User = Depends(get_current_user)):
    """Get user's notifications"""
    notifs = await db.notifications.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return notifs

@api_router.get("/notifications/unread-count")
async def get_unread_count(user: User = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({"user_id": user.user_id, "read": False})
    return {"count": count}

@api_router.post("/notifications/read")
async def mark_notifications_read(user: User = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Toutes les notifications lues"}

# ==================== CHALLENGE INVITE ====================

@api_router.post("/challenges/invite")
async def invite_to_challenge(request: Request, user: User = Depends(get_current_user)):
    """Invite a user to a challenge"""
    body = await request.json()
    challenge_id = body.get("challenge_id")
    invited_id = body.get("user_id")
    
    if not challenge_id or not invited_id:
        raise HTTPException(status_code=400, detail="challenge_id et user_id requis")
    
    challenge = await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Defi introuvable")
    
    invited = await db.users.find_one({"user_id": invited_id}, {"_id": 0})
    if not invited:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    await _create_notification(
        invited_id,
        "challenge_invite",
        f"{user.name} te defie : {challenge.get('title', '')}",
        {"challenge_id": challenge_id, "from_user_id": user.user_id, "invite_code": challenge.get("invite_code", "")}
    )
    return {"message": f"Invitation envoyee a {invited.get('name', '')}"}

@api_router.post("/challenges/create-and-invite")
async def create_and_invite(request: Request, user: User = Depends(get_current_user)):
    """Create a challenge and invite a specific user"""
    body = await request.json()
    invited_id = body.get("invited_user_id")
    
    invite_code = generate_invite_code()
    challenge = Challenge(
        title=body.get("title", "Defi entre amis"),
        description=body.get("description", ""),
        category=body.get("category", "General"),
        duration_days=body.get("duration_days", 7),
        difficulty=body.get("difficulty", "moyen"),
        validation_type="manual",
        is_public=False,
        challenge_type="friends",
        invite_code=invite_code,
        creator_id=user.user_id,
        creator_name=user.name,
        participants=[user.user_id],
        participant_count=1,
        has_pot=body.get("has_pot", False),
        pot_amount_per_person=body.get("pot_amount", 0),
        image=body.get("image"),
    )
    await db.challenges.insert_one(challenge.dict())
    
    # Auto-join creator
    uc = UserChallenge(user_id=user.user_id, challenge_id=challenge.challenge_id)
    await db.user_challenges.insert_one(uc.dict())
    await db.users.update_one({"user_id": user.user_id}, {"$push": {"joined_challenges": challenge.challenge_id}})
    
    # Invite the target user
    if invited_id:
        invited = await db.users.find_one({"user_id": invited_id}, {"_id": 0})
        if invited:
            await _create_notification(
                invited_id,
                "challenge_invite",
                f"{user.name} te defie : {challenge.title}",
                {"challenge_id": challenge.challenge_id, "from_user_id": user.user_id, "invite_code": invite_code}
            )
    
    await update_user_points(user.user_id, 5)
    return {**challenge.dict(), "invite_code": invite_code}

@api_router.put("/users/me/bio")
async def update_bio(request: Request, user: User = Depends(get_current_user)):
    """Update user bio"""
    body = await request.json()
    bio = body.get("bio", "")[:200]
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"bio": bio}})
    return {"message": "Bio mise à jour"}

@api_router.get("/users/me/stats")
async def get_my_stats(user: User = Depends(get_current_user)):
    """Get detailed user stats"""
    total_challenges = len(user.joined_challenges or [])
    completed = await db.user_challenges.count_documents({"user_id": user.user_id, "is_completed": True})
    active_count = await db.user_challenges.count_documents({"user_id": user.user_id, "is_completed": False})
    proof_count = await db.proofs.count_documents({"user_id": user.user_id})
    
    return {
        "total_challenges": total_challenges,
        "completed": completed,
        "active": active_count,
        "proofs_submitted": proof_count,
        "challenges_won": user.challenges_won,
        "challenges_lost": user.challenges_lost,
        "total_earnings": user.total_earnings,
        "friends_count": len(user.friends or []),
        "badges_count": len(user.badges or []),
    }

@api_router.get("/users/me/history")
async def get_challenge_history(user: User = Depends(get_current_user)):
    """Get user's challenge history"""
    user_challenges = await db.user_challenges.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort("start_date", -1).limit(20).to_list(20)
    
    result = []
    for uc in user_challenges:
        ch = await db.challenges.find_one({"challenge_id": uc["challenge_id"]}, {"_id": 0})
        if ch:
            result.append({**uc, "challenge": ch})
    return result

@api_router.post("/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: str, user: User = Depends(get_current_user)):
    """Join a challenge"""
    challenge = await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Check if already joined
    existing = await db.user_challenges.find_one({
        "user_id": user.user_id,
        "challenge_id": challenge_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already joined this challenge")
    
    # Create user challenge
    user_challenge = UserChallenge(
        user_id=user.user_id,
        challenge_id=challenge_id
    )
    await db.user_challenges.insert_one(user_challenge.dict())
    
    # Update challenge participant count
    await db.challenges.update_one(
        {"challenge_id": challenge_id},
        {
            "$push": {"participants": user.user_id},
            "$inc": {"participant_count": 1}
        }
    )
    
    # Update user's joined challenges
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$push": {"joined_challenges": challenge_id}}
    )
    
    # Award points for joining
    await update_user_points(user.user_id, 5)
    
    # Check for first challenge badge
    await check_and_award_badges(user.user_id)
    
    return {"message": "Joined challenge successfully"}

@api_router.get("/challenges/{challenge_id}/leaderboard")
async def get_challenge_leaderboard(challenge_id: str, limit: int = 10):
    """Get leaderboard for a specific challenge"""
    user_challenges = await db.user_challenges.find(
        {"challenge_id": challenge_id},
        {"_id": 0}
    ).sort("completed_days", -1).limit(limit).to_list(limit)
    
    result = []
    for uc in user_challenges:
        user = await db.users.find_one({"user_id": uc["user_id"]}, {"_id": 0})
        if user:
            result.append({
                "user_id": user["user_id"],
                "name": user["name"],
                "picture": user.get("picture"),
                "completed_days": uc["completed_days"],
                "current_day": uc["current_day"]
            })
    
    return result

# ==================== USER CHALLENGES ROUTES ====================

@api_router.get("/my-challenges")
async def get_my_challenges(user: User = Depends(get_current_user)):
    """Get current user's active challenges"""
    user_challenges = await db.user_challenges.find(
        {"user_id": user.user_id, "is_completed": False},
        {"_id": 0}
    ).to_list(100)
    
    result = []
    for uc in user_challenges:
        challenge = await db.challenges.find_one({"challenge_id": uc["challenge_id"]}, {"_id": 0})
        if challenge:
            result.append({
                **uc,
                "challenge": challenge
            })
    
    return result

# ==================== PROOF ROUTES ====================

@api_router.post("/proofs")
async def create_proof(proof_data: ProofCreate, user: User = Depends(get_current_user)):
    """Submit a proof for a challenge"""
    # Verify user is in the challenge
    user_challenge = await db.user_challenges.find_one({
        "user_id": user.user_id,
        "challenge_id": proof_data.challenge_id
    }, {"_id": 0})
    
    if not user_challenge:
        raise HTTPException(status_code=400, detail="You haven't joined this challenge")
    
    challenge = await db.challenges.find_one({"challenge_id": proof_data.challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Check if already submitted proof today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing_proof = await db.proofs.find_one({
        "user_id": user.user_id,
        "challenge_id": proof_data.challenge_id,
        "created_at": {"$gte": today_start}
    })
    
    if existing_proof:
        raise HTTPException(status_code=400, detail="You've already submitted a proof today for this challenge")
    
    # Create proof
    media_type = proof_data.media_type or ("image" if proof_data.image else "text")
    proof = Proof(
        user_id=user.user_id,
        user_name=user.name,
        user_picture=user.picture,
        challenge_id=proof_data.challenge_id,
        challenge_title=challenge["title"],
        image=proof_data.image if media_type == "image" else None,
        media_url=proof_data.image if media_type == "video" else None,
        media_type=media_type,
        text=proof_data.text,
        day_number=user_challenge["current_day"]
    )
    await db.proofs.insert_one(proof.dict())
    
    # Update user challenge progress
    new_day = user_challenge["current_day"] + 1
    completed_days = user_challenge["completed_days"] + 1
    is_completed = completed_days >= challenge["duration_days"]
    
    await db.user_challenges.update_one(
        {"user_challenge_id": user_challenge["user_challenge_id"]},
        {
            "$set": {
                "current_day": new_day,
                "completed_days": completed_days,
                "is_completed": is_completed
            },
            "$push": {"proofs": proof.proof_id}
        }
    )
    
    # Update user points and streak
    await update_user_points(user.user_id, 10)
    await update_user_streak(user.user_id)
    
    # Check for badges
    await check_and_award_badges(user.user_id)
    
    return proof.dict()

@api_router.get("/proofs")
async def get_proofs(challenge_id: Optional[str] = None, limit: int = 20):
    """Get recent proofs (feed)"""
    query = {}
    if challenge_id:
        query["challenge_id"] = challenge_id
    
    proofs = await db.proofs.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return proofs

@api_router.get("/proofs/feed")
async def get_proofs_feed(limit: int = 20):
    """Get global proofs feed"""
    proofs = await db.proofs.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return proofs

# ==================== MEDIA UPLOAD ====================

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_VIDEO = {".mp4", ".mov", ".webm", ".avi"}
ALLOWED_IMAGE = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

@api_router.post("/upload-media")
async def upload_media(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Upload a video or image file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Fichier requis")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_VIDEO and ext not in ALLOWED_IMAGE:
        raise HTTPException(status_code=400, detail=f"Format non supporte: {ext}")
    
    # Determine media type
    media_type = "video" if ext in ALLOWED_VIDEO else "image"
    
    # Generate unique filename
    file_id = f"{uuid.uuid4().hex[:16]}{ext}"
    file_path = UPLOAD_DIR / file_id
    
    # Save file with size check
    total_size = 0
    with open(file_path, "wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)  # 1MB chunks
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_FILE_SIZE:
                f.close()
                file_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 50MB)")
            f.write(chunk)
    
    media_url = f"/api/media/{file_id}"
    
    return {
        "media_url": media_url,
        "media_type": media_type,
        "filename": file_id,
        "size": total_size,
    }

@api_router.get("/media/{filename}")
async def serve_media(filename: str):
    """Serve uploaded media files"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    
    ext = Path(filename).suffix.lower()
    content_types = {
        ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
        ".avi": "video/x-msvideo", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
    }
    return FileResponse(file_path, media_type=content_types.get(ext, "application/octet-stream"))

# ==================== CHALLENGE PROOFS GALLERY ====================

@api_router.get("/challenges/{challenge_id}/proofs")
async def get_challenge_proofs(challenge_id: str, user: User = Depends(get_optional_user)):
    """Get all proofs for a challenge - visible to participants"""
    challenge = await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Defi introuvable")
    
    proofs = await db.proofs.find(
        {"challenge_id": challenge_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return proofs

@api_router.post("/proofs/{proof_id}/like")
async def like_proof(proof_id: str, user: User = Depends(get_current_user)):
    """Like a proof"""
    proof = await db.proofs.find_one({"proof_id": proof_id}, {"_id": 0})
    if not proof:
        raise HTTPException(status_code=404, detail="Proof not found")
    
    if user.user_id in proof.get("liked_by", []):
        # Unlike
        await db.proofs.update_one(
            {"proof_id": proof_id},
            {
                "$pull": {"liked_by": user.user_id},
                "$inc": {"likes": -1}
            }
        )
        return {"liked": False}
    else:
        # Like
        await db.proofs.update_one(
            {"proof_id": proof_id},
            {
                "$push": {"liked_by": user.user_id},
                "$inc": {"likes": 1}
            }
        )
        # Give reputation to proof creator
        await db.users.update_one(
            {"user_id": proof["user_id"]},
            {"$inc": {"reputation": 1}}
        )
        return {"liked": True}

# ==================== BADGE ROUTES ====================

@api_router.get("/badges")
async def get_all_badges():
    """Get all available badges"""
    return DEFAULT_BADGES

@api_router.get("/my-badges")
async def get_my_badges(user: User = Depends(get_current_user)):
    """Get current user's badges"""
    return user.badges

# ==================== ADDICTION ENGINE ====================

@api_router.get("/social-pressure")
async def get_social_pressure(user: User = Depends(get_current_user)):
    """Generate dynamic social pressure messages for the user"""
    messages = []
    
    # 1. Get user's rank
    all_users = await db.users.find({}, {"_id": 0}).sort("points", -1).to_list(200)
    user_rank = next((i + 1 for i, u in enumerate(all_users) if u["user_id"] == user.user_id), len(all_users))
    total_users = len(all_users)
    
    # 2. Find rivals (users just above)
    rivals_above = []
    for i, u in enumerate(all_users):
        if u["user_id"] == user.user_id and i > 0:
            rivals_above = all_users[max(0, i-2):i]
            break
    
    # 3. Recent proofs from others
    recent_proofs = await db.proofs.find(
        {"user_id": {"$ne": user.user_id}},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # 4. Generate pressure messages
    if user_rank > 3:
        if rivals_above:
            rival = rivals_above[-1]
            pts_diff = rival.get("points", 0) - user.points
            messages.append({
                "type": "rival",
                "icon": "trending-up",
                "color": "#FF3B30",
                "text": f"{rival.get('name', 'Un joueur')} est juste devant toi",
                "sub": f"Plus que {pts_diff} pts pour le dépasser",
                "urgency": "high"
            })
    
    if user_rank == 1:
        messages.append({
            "type": "leader",
            "icon": "trophy",
            "color": "#FFD700",
            "text": "Tu domines le classement !",
            "sub": "Reste concentré, ils arrivent",
            "urgency": "medium"
        })
    elif user_rank <= 3:
        messages.append({
            "type": "podium",
            "icon": "podium",
            "color": "#007AFF",
            "text": f"Tu es #{user_rank} au classement !",
            "sub": "Le podium est à portée de main",
            "urgency": "medium"
        })
    else:
        messages.append({
            "type": "rank",
            "icon": "arrow-up",
            "color": "#FF6B35",
            "text": f"Tu es #{user_rank} sur {total_users}",
            "sub": "Valide ton défi pour monter",
            "urgency": "high"
        })
    
    for p in recent_proofs[:2]:
        messages.append({
            "type": "activity",
            "icon": "flash",
            "color": "#AF52DE",
            "text": f"{p.get('user_name', 'Un joueur')} a validé son défi",
            "sub": p.get("challenge_title", ""),
            "urgency": "medium"
        })
    
    # Streak pressure
    if user.streak > 0:
        messages.append({
            "type": "streak",
            "icon": "flame",
            "color": "#FF6B35",
            "text": f"Streak de {user.streak} jours !",
            "sub": "Ne perds pas ta série, valide aujourd'hui",
            "urgency": "high"
        })
    elif user.streak == 0:
        messages.append({
            "type": "streak_lost",
            "icon": "warning",
            "color": "#FF3B30",
            "text": "Tu as perdu ton streak !",
            "sub": "Recommence maintenant, chaque jour compte",
            "urgency": "critical"
        })
    
    # Active challenges deadline
    user_challenges = await db.user_challenges.find(
        {"user_id": user.user_id, "is_completed": False}, {"_id": 0}
    ).to_list(10)
    for uc in user_challenges[:1]:
        ch = await db.challenges.find_one({"challenge_id": uc["challenge_id"]}, {"_id": 0})
        if ch:
            days_left = max(0, ch.get("duration_days", 30) - (uc.get("completed_days", 0)))
            if days_left <= 3:
                messages.append({
                    "type": "deadline",
                    "icon": "alarm",
                    "color": "#FF3B30",
                    "text": f"Plus que {days_left} jours !",
                    "sub": f"Défi \"{ch.get('title', '')}\" se termine bientôt",
                    "urgency": "critical"
                })
    
    return messages[:6]

@api_router.get("/user-rank")
async def get_user_rank(user: User = Depends(get_current_user)):
    """Get user's rank, nearby rivals, and progression data"""
    all_users = await db.users.find({}, {"_id": 0}).sort("points", -1).to_list(200)
    
    user_rank = len(all_users)
    user_idx = 0
    for i, u in enumerate(all_users):
        if u["user_id"] == user.user_id:
            user_rank = i + 1
            user_idx = i
            break
    
    total = len(all_users)
    
    # Rivals: 2 above and 2 below
    start = max(0, user_idx - 2)
    end = min(total, user_idx + 3)
    nearby = []
    for i in range(start, end):
        u = all_users[i]
        nearby.append({
            "rank": i + 1,
            "user_id": u["user_id"],
            "name": u.get("name", "?"),
            "picture": u.get("picture"),
            "points": u.get("points", 0),
            "is_me": u["user_id"] == user.user_id,
        })
    
    # Points to next rank
    pts_to_next = 0
    if user_idx > 0:
        pts_to_next = all_users[user_idx - 1].get("points", 0) - user.points
    
    # Total money in play
    pot_challenges = await db.challenges.find({"has_pot": True}, {"_id": 0, "pot_total": 1}).to_list(100)
    total_money = sum(c.get("pot_total", 0) for c in pot_challenges)
    
    return {
        "rank": user_rank,
        "total_players": total,
        "points": user.points,
        "level": user.level,
        "pts_to_next_rank": pts_to_next,
        "nearby_rivals": nearby,
        "total_money_in_play": total_money,
    }

@api_router.get("/daily-triggers")
async def get_daily_triggers(user: User = Depends(get_current_user)):
    """Get personalized triggers / reasons to come back"""
    triggers = []
    
    # Check active challenges that need validation today
    user_challenges = await db.user_challenges.find(
        {"user_id": user.user_id, "is_completed": False}, {"_id": 0}
    ).to_list(20)
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    for uc in user_challenges:
        ch = await db.challenges.find_one({"challenge_id": uc["challenge_id"]}, {"_id": 0})
        if not ch:
            continue
        
        # Check if validated today
        today_proof = await db.proofs.find_one({
            "user_id": user.user_id,
            "challenge_id": uc["challenge_id"],
            "created_at": {"$gte": today_start}
        })
        
        if not today_proof:
            triggers.append({
                "type": "validate",
                "icon": "camera",
                "color": "#FF3B30",
                "title": "Valide ton défi !",
                "text": ch.get("title", ""),
                "challenge_id": ch.get("challenge_id"),
                "has_pot": ch.get("has_pot", False),
                "pot_total": ch.get("pot_total", 0),
                "urgency": "critical"
            })
    
    if not triggers:
        triggers.append({
            "type": "explore",
            "icon": "compass",
            "color": "#007AFF",
            "title": "Explore de nouveaux défis",
            "text": "Lance-toi dans un nouveau challenge",
            "urgency": "low"
        })
    
    return triggers

@api_router.get("/money-stats")
async def get_money_stats(user: User = Depends(get_optional_user)):
    """Get money stats for home page - total pots, biggest pots etc"""
    pot_challenges = await db.challenges.find(
        {"has_pot": True}, {"_id": 0}
    ).sort("pot_total", -1).to_list(50)
    
    total_in_play = sum(c.get("pot_total", 0) for c in pot_challenges)
    biggest_pot = pot_challenges[0] if pot_challenges else None
    active_pot_count = len(pot_challenges)
    
    # User's money at stake
    user_money = 0
    if user:
        for ch in pot_challenges:
            if user.user_id in (ch.get("pot_contributions", []) or []):
                user_money += ch.get("pot_amount_per_person", 0)
    
    return {
        "total_in_play": total_in_play,
        "active_pot_count": active_pot_count,
        "biggest_pot": {
            "challenge_id": biggest_pot.get("challenge_id"),
            "title": biggest_pot.get("title"),
            "pot_total": biggest_pot.get("pot_total", 0),
        } if biggest_pot else None,
        "user_money_at_stake": user_money,
        "user_total_earnings": user.total_earnings if user else 0,
    }

# ==================== HELPER FUNCTIONS ====================

async def update_user_points(user_id: str, points: int):
    """Update user's points and level"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return
    
    new_points = user.get("points", 0) + points
    # Level up every 100 points
    new_level = (new_points // 100) + 1
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"points": new_points, "level": new_level}}
    )

async def update_user_streak(user_id: str):
    """Update user's streak"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return
    
    # Simple streak increment (in production, check for consecutive days)
    new_streak = user.get("streak", 0) + 1
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"streak": new_streak}}
    )

async def check_and_award_badges(user_id: str):
    """Check and award badges to user"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return
    
    current_badges = user.get("badges", [])
    new_badges = []
    
    for badge in DEFAULT_BADGES:
        if badge["badge_id"] in current_badges:
            continue
        
        # Check conditions
        if badge.get("required_points") and user.get("points", 0) >= badge["required_points"]:
            new_badges.append(badge["badge_id"])
        elif badge.get("required_streak") and user.get("streak", 0) >= badge["required_streak"]:
            new_badges.append(badge["badge_id"])
        elif badge.get("required_challenges"):
            joined = len(user.get("joined_challenges", []))
            if joined >= badge["required_challenges"]:
                new_badges.append(badge["badge_id"])
    
    if new_badges:
        await db.users.update_one(
            {"user_id": user_id},
            {"$push": {"badges": {"$each": new_badges}}}
        )

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for demo purposes"""
    # Create sample users for leaderboard
    sample_users = [
        {"user_id": "seed_user_1", "email": "alex@demo.com", "name": "Alex Martin", "picture": "https://images.unsplash.com/photo-1769636929231-3cd7f853d038?w=200&h=200&fit=crop&crop=face&q=80", "level": 8, "points": 780, "streak": 23, "reputation": 120, "badges": ["first_challenge", "streak_7", "streak_30", "points_100", "points_500"], "joined_challenges": [], "created_at": datetime.now(timezone.utc), "challenges_won": 12, "challenges_lost": 3, "total_earnings": 340, "friends": ["seed_user_2", "seed_user_3"], "bio": "No pain, no gain."},
        {"user_id": "seed_user_2", "email": "sarah@demo.com", "name": "Sarah Dubois", "picture": "https://images.unsplash.com/photo-1665224752136-4dbe2dfc8195?w=200&h=200&fit=crop&crop=face&q=80", "level": 6, "points": 580, "streak": 15, "reputation": 89, "badges": ["first_challenge", "streak_7", "points_100", "points_500"], "joined_challenges": [], "created_at": datetime.now(timezone.utc), "challenges_won": 8, "challenges_lost": 2, "total_earnings": 180, "friends": ["seed_user_1"], "bio": "Discipline is freedom."},
        {"user_id": "seed_user_3", "email": "thomas@demo.com", "name": "Thomas Leroy", "picture": "https://images.unsplash.com/photo-1767175620484-1ed37931a0d1?w=200&h=200&fit=crop&crop=face&q=80", "level": 5, "points": 450, "streak": 12, "reputation": 67, "badges": ["first_challenge", "streak_7", "points_100"], "joined_challenges": [], "created_at": datetime.now(timezone.utc), "challenges_won": 5, "challenges_lost": 4, "total_earnings": 90, "friends": ["seed_user_1"], "bio": ""},
        {"user_id": "seed_user_4", "email": "emma@demo.com", "name": "Emma Bernard", "picture": "https://images.unsplash.com/photo-1610721193651-e6aca85b45aa?w=200&h=200&fit=crop&crop=face&q=80", "level": 4, "points": 320, "streak": 9, "reputation": 45, "badges": ["first_challenge", "streak_7", "points_100"], "joined_challenges": [], "created_at": datetime.now(timezone.utc), "challenges_won": 3, "challenges_lost": 2, "total_earnings": 50, "friends": [], "bio": ""},
        {"user_id": "seed_user_5", "email": "lucas@demo.com", "name": "Lucas Petit", "picture": "https://images.unsplash.com/photo-1758534063829-a72058381e21?w=200&h=200&fit=crop&crop=face&q=80", "level": 3, "points": 210, "streak": 7, "reputation": 32, "badges": ["first_challenge", "streak_7", "points_100"], "joined_challenges": [], "created_at": datetime.now(timezone.utc), "challenges_won": 2, "challenges_lost": 3, "total_earnings": 20, "friends": [], "bio": ""},
        {"user_id": "seed_user_6", "email": "julie@demo.com", "name": "Julie Moreau", "picture": "https://images.unsplash.com/photo-1544334599-eba0d8934b6f?w=200&h=200&fit=crop&crop=face&q=80", "level": 3, "points": 180, "streak": 5, "reputation": 28, "badges": ["first_challenge", "streak_7"], "joined_challenges": [], "created_at": datetime.now(timezone.utc), "challenges_won": 1, "challenges_lost": 2, "total_earnings": 0, "friends": [], "bio": ""},
        {"user_id": "seed_user_7", "email": "hugo@demo.com", "name": "Hugo Lambert", "picture": "https://images.unsplash.com/photo-1764545973653-94c40d993495?w=200&h=200&fit=crop&crop=face&q=80", "level": 2, "points": 140, "streak": 4, "reputation": 18, "badges": ["first_challenge"], "joined_challenges": [], "created_at": datetime.now(timezone.utc), "challenges_won": 1, "challenges_lost": 1, "total_earnings": 0, "friends": [], "bio": ""},
        {"user_id": "seed_user_8", "email": "lea@demo.com", "name": "Léa Richard", "picture": "https://images.unsplash.com/photo-1771072428365-f0f97d0d25b7?w=200&h=200&fit=crop&crop=face&q=80", "level": 2, "points": 95, "streak": 3, "reputation": 12, "badges": ["first_challenge"], "joined_challenges": [], "created_at": datetime.now(timezone.utc), "challenges_won": 0, "challenges_lost": 1, "total_earnings": 0, "friends": [], "bio": ""},
    ]
    
    for u in sample_users:
        existing = await db.users.find_one({"user_id": u["user_id"]})
        if not existing:
            await db.users.insert_one(u)
    # Create sample challenges - WITH MONEY POTS for addiction
    sample_challenges = [
        {
            "challenge_id": "challenge_sport1",
            "title": "30 Jours de Course",
            "description": "Courez au moins 2km chaque jour pendant 30 jours. Repoussez vos limites et construisez une habitude de champion.",
            "category": "Sport",
            "duration_days": 30,
            "is_public": True,
            "creator_id": "system",
            "creator_name": "Challenge It",
            "participants": ["seed_user_1", "seed_user_2", "seed_user_3"],
            "participant_count": 156,
            "has_pot": True,
            "pot_amount_per_person": 20,
            "pot_total": 3120,
            "pot_contributions": ["seed_user_1", "seed_user_2", "seed_user_3"],
            "image": "https://images.unsplash.com/photo-1603455778956-d71832eafa4e?w=800&h=500&fit=crop&q=80",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "challenge_id": "challenge_sante1",
            "title": "Méditation Matinale",
            "description": "10 minutes de méditation chaque matin. Trouvez la paix intérieure et la clarté mentale.",
            "category": "Santé",
            "duration_days": 21,
            "is_public": True,
            "creator_id": "system",
            "creator_name": "Challenge It",
            "participants": ["seed_user_4"],
            "participant_count": 89,
            "has_pot": True,
            "pot_amount_per_person": 10,
            "pot_total": 890,
            "pot_contributions": ["seed_user_4"],
            "image": "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=800&h=500&fit=crop&q=80",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "challenge_id": "challenge_habitudes1",
            "title": "Réveil 5h du Matin",
            "description": "Se lever à 5h chaque jour pendant 30 jours. Devenez une machine de discipline et de productivité.",
            "category": "Habitudes",
            "duration_days": 30,
            "is_public": True,
            "creator_id": "system",
            "creator_name": "Challenge It",
            "participants": ["seed_user_1", "seed_user_5"],
            "participant_count": 234,
            "has_pot": True,
            "pot_amount_per_person": 50,
            "pot_total": 11700,
            "pot_contributions": ["seed_user_1", "seed_user_5"],
            "image": "https://images.unsplash.com/photo-1740210147580-513028fcf04a?w=800&h=500&fit=crop&q=80",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "challenge_id": "challenge_business1",
            "title": "Créer du Contenu",
            "description": "Publier un post LinkedIn chaque jour. Bâtissez votre marque personnelle et votre réseau.",
            "category": "Business",
            "duration_days": 30,
            "is_public": True,
            "creator_id": "system",
            "creator_name": "Challenge It",
            "participants": [],
            "participant_count": 67,
            "has_pot": False,
            "pot_amount_per_person": 0,
            "pot_total": 0,
            "image": "https://images.unsplash.com/photo-1758874384315-995106662187?w=800&h=500&fit=crop&q=80",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "challenge_id": "challenge_sport2",
            "title": "100 Pompes par Jour",
            "description": "Faire 100 pompes chaque jour pendant 30 jours. Transformez votre corps et votre mental.",
            "category": "Sport",
            "duration_days": 30,
            "is_public": True,
            "creator_id": "system",
            "creator_name": "Challenge It",
            "participants": ["seed_user_2", "seed_user_6"],
            "participant_count": 178,
            "has_pot": True,
            "pot_amount_per_person": 15,
            "pot_total": 2670,
            "pot_contributions": ["seed_user_2", "seed_user_6"],
            "image": "https://images.unsplash.com/photo-1648235692910-947cb90ddd97?w=800&h=500&fit=crop&q=80",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for challenge in sample_challenges:
        existing = await db.challenges.find_one({"challenge_id": challenge["challenge_id"]})
        if not existing:
            await db.challenges.insert_one(challenge)
    
    return {"message": "Data seeded successfully"}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Challenge It API v1.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
