# Auth Testing Playbook for Challenge It

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  level: 3,
  points: 230,
  streak: 7,
  reputation: 42,
  badges: ['first_challenge', 'streak_7'],
  joined_challenges: [],
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Test health
curl -s https://gamified-goals-12.preview.emergentagent.com/api/health

# Test auth
curl -s https://gamified-goals-12.preview.emergentagent.com/api/auth/me \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Seed data
curl -s -X POST https://gamified-goals-12.preview.emergentagent.com/api/seed

# Get challenges
curl -s https://gamified-goals-12.preview.emergentagent.com/api/challenges

# Get trending
curl -s https://gamified-goals-12.preview.emergentagent.com/api/challenges/trending

# Get leaderboard
curl -s https://gamified-goals-12.preview.emergentagent.com/api/leaderboard
```

## Step 3: Browser Testing
```python
# Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "gamified-goals-12.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://gamified-goals-12.preview.emergentagent.com")
```
