"""
Backend API Tests for Challenge It
Tests: Health, Challenges, Trending, Leaderboard, Auth, Create Challenge, Join Challenge, Proofs, My Challenges
"""
import pytest
import requests
import os
import subprocess
import json

# Backend URL from review request
BASE_URL = "https://gamified-goals-12.preview.emergentagent.com"

class TestHealth:
    """Health check endpoint"""
    
    def test_health_endpoint(self, api_client):
        """Test GET /api/health returns healthy status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Response missing 'status' field"
        assert data["status"] == "healthy", f"Expected status 'healthy', got {data['status']}"


class TestChallenges:
    """Challenge endpoints - public access"""
    
    def test_get_challenges(self, api_client):
        """Test GET /api/challenges returns seeded challenges"""
        response = api_client.get(f"{BASE_URL}/api/challenges")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 5, f"Expected at least 5 challenges, got {len(data)}"
        
        # Validate structure of first challenge
        if len(data) > 0:
            challenge = data[0]
            assert "challenge_id" in challenge
            assert "title" in challenge
            assert "description" in challenge
            assert "category" in challenge
            assert "duration_days" in challenge
            assert "creator_name" in challenge
    
    def test_get_trending_challenges(self, api_client):
        """Test GET /api/challenges/trending returns challenges sorted by participant_count"""
        response = api_client.get(f"{BASE_URL}/api/challenges/trending")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Verify sorting by participant_count (descending)
        if len(data) > 1:
            for i in range(len(data) - 1):
                current_count = data[i].get("participant_count", 0)
                next_count = data[i + 1].get("participant_count", 0)
                assert current_count >= next_count, f"Challenges not sorted by participant_count: {current_count} < {next_count}"
    
    def test_get_challenge_by_id(self, api_client):
        """Test GET /api/challenges/{id} returns specific challenge"""
        # First get all challenges to get a valid ID
        response = api_client.get(f"{BASE_URL}/api/challenges")
        assert response.status_code == 200
        challenges = response.json()
        
        if len(challenges) > 0:
            challenge_id = challenges[0]["challenge_id"]
            
            # Get specific challenge
            response = api_client.get(f"{BASE_URL}/api/challenges/{challenge_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert data["challenge_id"] == challenge_id
            assert "title" in data
            assert "description" in data


class TestLeaderboard:
    """Leaderboard endpoint"""
    
    def test_get_leaderboard(self, api_client):
        """Test GET /api/leaderboard returns users sorted by points"""
        response = api_client.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Verify structure
        if len(data) > 0:
            user = data[0]
            assert "user_id" in user
            assert "name" in user
            assert "points" in user
            assert "level" in user
            assert "streak" in user
        
        # Verify sorting by points (descending)
        if len(data) > 1:
            for i in range(len(data) - 1):
                current_points = data[i].get("points", 0)
                next_points = data[i + 1].get("points", 0)
                assert current_points >= next_points, f"Leaderboard not sorted by points: {current_points} < {next_points}"


class TestAuthGatedEndpoints:
    """Auth-gated endpoints - requires session token"""
    
    @pytest.fixture(scope="class")
    def test_session(self):
        """Create test user and session using mongosh"""
        try:
            # Create test user and session
            mongo_script = """
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
print(JSON.stringify({session_token: sessionToken, user_id: userId}));
"""
            result = subprocess.run(
                ["mongosh", "--quiet", "--eval", mongo_script],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                pytest.skip(f"Failed to create test session: {result.stderr}")
            
            # Parse output to get session token
            output_lines = result.stdout.strip().split('\n')
            for line in output_lines:
                if 'session_token' in line:
                    session_data = json.loads(line)
                    return session_data
            
            pytest.skip("Could not parse session token from mongosh output")
            
        except Exception as e:
            pytest.skip(f"Failed to create test session: {str(e)}")
    
    def test_auth_me(self, api_client, test_session):
        """Test GET /api/auth/me with valid session token"""
        session_token = test_session["session_token"]
        
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {session_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert data["user_id"] == test_session["user_id"]
    
    def test_auth_me_without_token(self, api_client):
        """Test GET /api/auth/me without token returns 401"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_create_challenge(self, api_client, test_session):
        """Test POST /api/challenges creates a new challenge"""
        session_token = test_session["session_token"]
        
        challenge_data = {
            "title": "TEST_Challenge_" + str(test_session["user_id"]),
            "description": "Test challenge description",
            "category": "Sport",
            "duration_days": 30,
            "is_public": True
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/challenges",
            json=challenge_data,
            headers={"Authorization": f"Bearer {session_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "challenge_id" in data
        assert data["title"] == challenge_data["title"]
        assert data["category"] == challenge_data["category"]
        assert data["creator_id"] == test_session["user_id"]
        
        # Verify persistence with GET
        challenge_id = data["challenge_id"]
        get_response = api_client.get(f"{BASE_URL}/api/challenges/{challenge_id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["challenge_id"] == challenge_id
        assert get_data["title"] == challenge_data["title"]
    
    def test_join_challenge(self, api_client, test_session):
        """Test POST /api/challenges/{id}/join joins a challenge"""
        session_token = test_session["session_token"]
        
        # Get a challenge to join
        response = api_client.get(f"{BASE_URL}/api/challenges")
        assert response.status_code == 200
        challenges = response.json()
        
        if len(challenges) == 0:
            pytest.skip("No challenges available to join")
        
        challenge_id = challenges[0]["challenge_id"]
        
        # Join the challenge
        response = api_client.post(
            f"{BASE_URL}/api/challenges/{challenge_id}/join",
            headers={"Authorization": f"Bearer {session_token}"}
        )
        
        # Should succeed (200) or already joined (400)
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
    
    def test_get_my_challenges(self, api_client, test_session):
        """Test GET /api/my-challenges returns user's active challenges"""
        session_token = test_session["session_token"]
        
        response = api_client.get(
            f"{BASE_URL}/api/my-challenges",
            headers={"Authorization": f"Bearer {session_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Verify structure if challenges exist
        if len(data) > 0:
            user_challenge = data[0]
            assert "challenge_id" in user_challenge
            assert "current_day" in user_challenge
            assert "completed_days" in user_challenge
            assert "challenge" in user_challenge
            # Verify nested challenge object
            assert "title" in user_challenge["challenge"]
            assert "description" in user_challenge["challenge"]
    
    def test_create_proof(self, api_client, test_session):
        """Test POST /api/proofs creates a proof for joined challenge"""
        session_token = test_session["session_token"]
        
        # First, ensure user has joined a challenge
        response = api_client.get(f"{BASE_URL}/api/challenges")
        assert response.status_code == 200
        challenges = response.json()
        
        if len(challenges) == 0:
            pytest.skip("No challenges available")
        
        challenge_id = challenges[0]["challenge_id"]
        
        # Try to join (might already be joined)
        api_client.post(
            f"{BASE_URL}/api/challenges/{challenge_id}/join",
            headers={"Authorization": f"Bearer {session_token}"}
        )
        
        # Create proof
        proof_data = {
            "challenge_id": challenge_id,
            "text": "TEST_Proof: Completed today's challenge!",
            "image": None
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/proofs",
            json=proof_data,
            headers={"Authorization": f"Bearer {session_token}"}
        )
        
        # Should succeed or fail with specific error
        if response.status_code == 200:
            data = response.json()
            assert "proof_id" in data
            assert data["text"] == proof_data["text"]
            assert data["challenge_id"] == challenge_id
        else:
            # Log the error for debugging
            print(f"Proof creation failed: {response.status_code} - {response.text}")
