from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
    level: int = 1
    points: int = 0
    streak: int = 0
    reputation: int = 0
    badges: List[str] = []
    joined_challenges: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Challenge(BaseModel):
    challenge_id: str = Field(default_factory=lambda: f"challenge_{uuid.uuid4().hex[:12]}")
    title: str
    description: str
    category: str  # Sport, Santé, Habitudes, Business, Autre
    duration_days: int
    is_public: bool = True
    creator_id: str
    creator_name: str
    participants: List[str] = []
    participant_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    image: Optional[str] = None

class ChallengeCreate(BaseModel):
    title: str
    description: str
    category: str
    duration_days: int
    is_public: bool = True
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
    image: Optional[str] = None  # Base64 encoded
    text: str
    day_number: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    likes: int = 0
    liked_by: List[str] = []

class ProofCreate(BaseModel):
    challenge_id: str
    image: Optional[str] = None
    text: str

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
            "streak": u.get("streak", 0)
        }
        for u in users
    ]

# ==================== CHALLENGE ROUTES ====================

@api_router.post("/challenges")
async def create_challenge(challenge_data: ChallengeCreate, user: User = Depends(get_current_user)):
    """Create a new challenge"""
    challenge = Challenge(
        title=challenge_data.title,
        description=challenge_data.description,
        category=challenge_data.category,
        duration_days=challenge_data.duration_days,
        is_public=challenge_data.is_public,
        creator_id=user.user_id,
        creator_name=user.name,
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
    proof = Proof(
        user_id=user.user_id,
        user_name=user.name,
        user_picture=user.picture,
        challenge_id=proof_data.challenge_id,
        challenge_title=challenge["title"],
        image=proof_data.image,
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
    # Create sample challenges
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
            "participants": [],
            "participant_count": 156,
            "image": "https://images.unsplash.com/photo-1758521959972-83d0bd10a152?w=800&h=500&fit=crop&q=80",
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
            "participants": [],
            "participant_count": 89,
            "image": "https://images.unsplash.com/photo-1759951611066-d208d302e886?w=800&h=500&fit=crop&q=80",
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
            "participants": [],
            "participant_count": 234,
            "image": "https://images.unsplash.com/photo-1774185644417-b32c25456aae?w=800&h=500&fit=crop&q=80",
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
            "image": "https://images.unsplash.com/photo-1672094272561-3d4e3685a3fa?w=800&h=500&fit=crop&q=80",
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
            "participants": [],
            "participant_count": 178,
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
