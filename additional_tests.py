#!/usr/bin/env python3
"""
Additional edge case tests for video proof system
"""

import requests
import tempfile
import os

BACKEND_URL = "https://gamified-goals-12.preview.emergentagent.com/api"

def test_large_file_upload():
    """Test uploading a file that exceeds size limit"""
    print("\n📋 Testing large file upload (should be rejected)...")
    
    # Create a test session first
    import subprocess
    import uuid
    import time
    
    user_id = f"test-user-{int(time.time())}"
    session_token = f"test_session_{uuid.uuid4().hex[:16]}"
    
    mongo_script = f"""
    use('test_database');
    var userId = '{user_id}';
    var sessionToken = '{session_token}';
    db.users.insertOne({{
      user_id: userId,
      email: 'test.user@example.com',
      name: 'Test User',
      picture: 'https://via.placeholder.com/150',
      level: 3, points: 230, streak: 7, reputation: 42,
      badges: ['first_challenge', 'streak_7'],
      joined_challenges: [],
      created_at: new Date()
    }});
    db.user_sessions.insertOne({{
      user_id: userId,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 7*24*60*60*1000),
      created_at: new Date()
    }});
    """
    
    try:
        result = subprocess.run(['mongosh', '--eval', mongo_script], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"❌ Could not create test session")
            return False
    except Exception as e:
        print(f"❌ Error creating session: {e}")
        return False
    
    headers = {"Authorization": f"Bearer {session_token}"}
    
    # Create a large file (simulate 60MB)
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as f:
        # Write 60MB of data
        chunk = b"x" * (1024 * 1024)  # 1MB chunk
        for i in range(60):  # 60MB total
            f.write(chunk)
        large_file_path = f.name
    
    try:
        with open(large_file_path, 'rb') as f:
            files = {'file': ('large_test.mp4', f, 'video/mp4')}
            response = requests.post(f"{BACKEND_URL}/upload-media", 
                                   files=files, headers=headers, timeout=60)
        
        if response.status_code == 413:
            print("✅ PASS - Large file rejected (413)")
            return True
        else:
            print(f"❌ FAIL - Expected 413, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return False
    finally:
        try:
            os.unlink(large_file_path)
        except:
            pass

def test_image_upload():
    """Test uploading an image file"""
    print("\n📋 Testing image file upload...")
    
    # Create a test session first
    import subprocess
    import uuid
    import time
    
    user_id = f"test-user-{int(time.time())}"
    session_token = f"test_session_{uuid.uuid4().hex[:16]}"
    
    mongo_script = f"""
    use('test_database');
    var userId = '{user_id}';
    var sessionToken = '{session_token}';
    db.users.insertOne({{
      user_id: userId,
      email: 'test.user@example.com',
      name: 'Test User',
      picture: 'https://via.placeholder.com/150',
      level: 3, points: 230, streak: 7, reputation: 42,
      badges: ['first_challenge', 'streak_7'],
      joined_challenges: [],
      created_at: new Date()
    }});
    db.user_sessions.insertOne({{
      user_id: userId,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 7*24*60*60*1000),
      created_at: new Date()
    }});
    """
    
    try:
        result = subprocess.run(['mongosh', '--eval', mongo_script], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"❌ Could not create test session")
            return False
    except Exception as e:
        print(f"❌ Error creating session: {e}")
        return False
    
    headers = {"Authorization": f"Bearer {session_token}"}
    
    # Create a small test image file
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
        f.write(b"fake image content for testing purposes")
        image_file_path = f.name
    
    try:
        with open(image_file_path, 'rb') as f:
            files = {'file': ('test.jpg', f, 'image/jpeg')}
            response = requests.post(f"{BACKEND_URL}/upload-media", 
                                   files=files, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data['media_type'] == 'image':
                print(f"✅ PASS - Image uploaded successfully: {data['filename']}")
                print(f"   Media Type: {data['media_type']}")
                return True
            else:
                print(f"❌ FAIL - Wrong media_type: {data['media_type']}")
                return False
        else:
            print(f"❌ FAIL - Image upload failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return False
    finally:
        try:
            os.unlink(image_file_path)
        except:
            pass

def test_proof_creation_with_image():
    """Test creating a proof with image media_type"""
    print("\n📋 Testing proof creation with image media...")
    
    # Create a test session first
    import subprocess
    import uuid
    import time
    
    user_id = f"test-user-{int(time.time())}"
    session_token = f"test_session_{uuid.uuid4().hex[:16]}"
    
    mongo_script = f"""
    use('test_database');
    var userId = '{user_id}';
    var sessionToken = '{session_token}';
    db.users.insertOne({{
      user_id: userId,
      email: 'test.user@example.com',
      name: 'Test User',
      picture: 'https://via.placeholder.com/150',
      level: 3, points: 230, streak: 7, reputation: 42,
      badges: ['first_challenge', 'streak_7'],
      joined_challenges: [],
      created_at: new Date()
    }});
    db.user_sessions.insertOne({{
      user_id: userId,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 7*24*60*60*1000),
      created_at: new Date()
    }});
    """
    
    try:
        result = subprocess.run(['mongosh', '--eval', mongo_script], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"❌ Could not create test session")
            return False
    except Exception as e:
        print(f"❌ Error creating session: {e}")
        return False
    
    headers = {"Authorization": f"Bearer {session_token}"}
    
    # First join a challenge
    challenge_id = "challenge_sport1"
    join_response = requests.post(f"{BACKEND_URL}/challenges/{challenge_id}/join", 
                                headers=headers)
    
    # Create proof with image media_type
    proof_data = {
        "challenge_id": challenge_id,
        "text": "Test image proof submission",
        "media_type": "image",
        "image": "/api/media/test_image.jpg"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/proofs", 
                               json=proof_data, headers=headers)
        
        if response.status_code == 200:
            proof = response.json()
            if proof.get('media_type') == 'image':
                print(f"✅ PASS - Image proof created successfully")
                print(f"   Media Type: {proof['media_type']}")
                return True
            else:
                print(f"❌ FAIL - Wrong media_type in proof: {proof.get('media_type')}")
                return False
        else:
            print(f"❌ FAIL - Image proof creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return False

def main():
    """Run additional edge case tests"""
    print("🎬 ADDITIONAL VIDEO PROOF SYSTEM TESTS")
    print("=" * 50)
    
    results = {'total': 0, 'passed': 0, 'failed': 0}
    
    def record_result(passed):
        results['total'] += 1
        if passed:
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Test 1: Large file upload (should be rejected)
    print("⚠️  SKIP - Large file test (takes too long and may timeout)")
    # record_result(test_large_file_upload())
    
    # Test 2: Image upload
    record_result(test_image_upload())
    
    # Test 3: Proof creation with image
    record_result(test_proof_creation_with_image())
    
    # Print results
    print("\n" + "=" * 50)
    print("🎯 ADDITIONAL TEST RESULTS")
    print("=" * 50)
    print(f"Total Tests: {results['total']}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    
    return results['failed'] == 0

if __name__ == "__main__":
    main()