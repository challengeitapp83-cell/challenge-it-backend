#!/usr/bin/env python3
"""
Backend Test Suite for Challenge It - Video Proof System
Tests the new video proof endpoints and media upload functionality
"""

import requests
import json
import os
import tempfile
from pathlib import Path

# Configuration
BACKEND_URL = "https://gamified-goals-12.preview.emergentagent.com/api"
TEST_USER_EMAIL = "test.user@example.com"
TEST_USER_NAME = "Test User"

def create_test_session():
    """Create a test user session for authentication"""
    print("🔧 Creating test session...")
    
    # Create test user and session via seed endpoint
    response = requests.post(f"{BACKEND_URL}/seed")
    if response.status_code != 200:
        print(f"❌ Failed to seed data: {response.status_code}")
        return None
    
    # Create a test session manually using MongoDB
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
      email: '{TEST_USER_EMAIL}',
      name: '{TEST_USER_NAME}',
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
    print('Session created successfully');
    """
    
    try:
        result = subprocess.run(['mongosh', '--eval', mongo_script], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"✅ Test session created: {session_token}")
            return session_token
        else:
            print(f"❌ MongoDB session creation failed: {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ Error creating session: {e}")
        return None

def create_test_files():
    """Create test files for upload testing"""
    test_files = {}
    
    # Create a small test video file (fake .mp4)
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as f:
        f.write(b"fake video content for testing purposes")
        test_files['video'] = f.name
    
    # Create a small test image file
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
        f.write(b"fake image content for testing purposes")
        test_files['image'] = f.name
    
    # Create an invalid file type
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as f:
        f.write(b"this should be rejected")
        test_files['invalid'] = f.name
    
    return test_files

def cleanup_test_files(test_files):
    """Clean up temporary test files"""
    for file_path in test_files.values():
        try:
            os.unlink(file_path)
        except:
            pass

def test_upload_media_auth_required():
    """Test that upload-media requires authentication"""
    print("\n📋 Testing upload-media auth requirement...")
    
    test_files = create_test_files()
    
    try:
        with open(test_files['video'], 'rb') as f:
            files = {'file': ('test.mp4', f, 'video/mp4')}
            response = requests.post(f"{BACKEND_URL}/upload-media", files=files)
        
        if response.status_code == 401:
            print("✅ PASS - Upload requires authentication (401)")
            return True
        else:
            print(f"❌ FAIL - Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return False
    finally:
        cleanup_test_files(test_files)

def test_upload_media_valid_file(auth_token):
    """Test uploading a valid media file"""
    print("\n📋 Testing valid media file upload...")
    
    test_files = create_test_files()
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        with open(test_files['video'], 'rb') as f:
            files = {'file': ('test.mp4', f, 'video/mp4')}
            response = requests.post(f"{BACKEND_URL}/upload-media", 
                                   files=files, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ['media_url', 'media_type', 'filename', 'size']
            
            if all(field in data for field in required_fields):
                if data['media_type'] == 'video':
                    print(f"✅ PASS - File uploaded successfully: {data['filename']}")
                    print(f"   Media URL: {data['media_url']}")
                    print(f"   Media Type: {data['media_type']}")
                    print(f"   Size: {data['size']} bytes")
                    return data
                else:
                    print(f"❌ FAIL - Wrong media_type: {data['media_type']}")
                    return None
            else:
                print(f"❌ FAIL - Missing required fields in response")
                return None
        else:
            print(f"❌ FAIL - Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return None
    finally:
        cleanup_test_files(test_files)

def test_upload_invalid_format(auth_token):
    """Test uploading invalid file format"""
    print("\n📋 Testing invalid file format upload...")
    
    test_files = create_test_files()
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        with open(test_files['invalid'], 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            response = requests.post(f"{BACKEND_URL}/upload-media", 
                                   files=files, headers=headers)
        
        if response.status_code == 400:
            print("✅ PASS - Invalid format rejected (400)")
            return True
        else:
            print(f"❌ FAIL - Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return False
    finally:
        cleanup_test_files(test_files)

def test_serve_media(media_filename):
    """Test serving uploaded media file"""
    print(f"\n📋 Testing media file serving: {media_filename}...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/media/{media_filename}")
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'video' in content_type or 'image' in content_type:
                print(f"✅ PASS - Media served successfully")
                print(f"   Content-Type: {content_type}")
                print(f"   Content-Length: {len(response.content)} bytes")
                return True
            else:
                print(f"❌ FAIL - Wrong content-type: {content_type}")
                return False
        else:
            print(f"❌ FAIL - Media serving failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return False

def test_serve_nonexistent_media():
    """Test serving non-existent media file"""
    print("\n📋 Testing non-existent media file...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/media/nonexistent.mp4")
        
        if response.status_code == 404:
            print("✅ PASS - Non-existent file returns 404")
            return True
        else:
            print(f"❌ FAIL - Expected 404, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return False

def test_challenge_proofs_endpoint():
    """Test getting challenge proofs"""
    print("\n📋 Testing challenge proofs endpoint...")
    
    # Use a seeded challenge ID
    challenge_id = "challenge_sport1"
    
    try:
        response = requests.get(f"{BACKEND_URL}/challenges/{challenge_id}/proofs")
        
        if response.status_code == 200:
            proofs = response.json()
            print(f"✅ PASS - Challenge proofs retrieved: {len(proofs)} proofs")
            
            # Check if any proofs have media_type and media_url fields
            for proof in proofs:
                if 'media_type' in proof and 'media_url' in proof:
                    print(f"   Found proof with media_type: {proof['media_type']}")
                    break
            
            return True
        else:
            print(f"❌ FAIL - Challenge proofs failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return False

def test_create_proof_with_media(auth_token, media_url):
    """Test creating a proof with media_type field"""
    print("\n📋 Testing proof creation with media...")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # First, join a challenge
    challenge_id = "challenge_sport1"
    join_response = requests.post(f"{BACKEND_URL}/challenges/{challenge_id}/join", 
                                headers=headers)
    
    if join_response.status_code not in [200, 400]:  # 400 might mean already joined
        print(f"❌ FAIL - Could not join challenge: {join_response.status_code}")
        return False
    
    # Create proof with media
    proof_data = {
        "challenge_id": challenge_id,
        "text": "Test video proof submission",
        "media_type": "video",
        "image": media_url  # The image field is used for media_url
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/proofs", 
                               json=proof_data, headers=headers)
        
        if response.status_code == 200:
            proof = response.json()
            if 'media_type' in proof and 'media_url' in proof:
                print(f"✅ PASS - Proof created with media")
                print(f"   Media Type: {proof['media_type']}")
                print(f"   Media URL: {proof['media_url']}")
                return True
            else:
                print(f"❌ FAIL - Proof missing media fields")
                return False
        else:
            print(f"❌ FAIL - Proof creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR - {e}")
        return False

def main():
    """Run all video proof system tests"""
    print("🎬 CHALLENGE IT - VIDEO PROOF SYSTEM TESTS")
    print("=" * 50)
    
    # Test results tracking
    results = {
        'total': 0,
        'passed': 0,
        'failed': 0
    }
    
    def record_result(passed):
        results['total'] += 1
        if passed:
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Test 1: Upload media auth requirement
    record_result(test_upload_media_auth_required())
    
    # Create test session for authenticated tests
    auth_token = create_test_session()
    if not auth_token:
        print("\n❌ CRITICAL - Could not create test session. Stopping tests.")
        return
    
    # Test 2: Valid file upload
    upload_result = test_upload_media_valid_file(auth_token)
    record_result(upload_result is not None)
    
    # Test 3: Invalid format upload
    record_result(test_upload_invalid_format(auth_token))
    
    # Test 4: Serve uploaded media (if upload succeeded)
    if upload_result:
        filename = upload_result['filename']
        record_result(test_serve_media(filename))
    else:
        print("\n⚠️  SKIP - Media serving test (no uploaded file)")
        results['total'] += 1
    
    # Test 5: Serve non-existent media
    record_result(test_serve_nonexistent_media())
    
    # Test 6: Challenge proofs endpoint
    record_result(test_challenge_proofs_endpoint())
    
    # Test 7: Create proof with media (if upload succeeded)
    if upload_result:
        media_url = upload_result['media_url']
        record_result(test_create_proof_with_media(auth_token, media_url))
    else:
        print("\n⚠️  SKIP - Proof with media test (no uploaded file)")
        results['total'] += 1
    
    # Print final results
    print("\n" + "=" * 50)
    print("🎯 TEST RESULTS SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {results['total']}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    
    if results['failed'] == 0:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  {results['failed']} TESTS FAILED")
    
    return results['failed'] == 0

if __name__ == "__main__":
    main()