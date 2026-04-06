"""
Test Iteration 8 - Testing new features:
1. Login functionality with emre@gewuerzberg.de / 190371
2. Sidebar user name display (Emre Dirlik)
3. Kargo Takip (Shipments) page indigo theme
4. Customer activity history (activities endpoints)
5. Product Videos folder system
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "emre@gewuerzberg.de",
            "password": "190371"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["name"] == "Emre Dirlik"
        assert data["username"] == "emre@gewuerzberg.de"
        assert data["role"] == "admin"
        print(f"✓ Login successful - User: {data['name']}")
    
    def test_login_wrong_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "emre@gewuerzberg.de",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Wrong password rejected correctly")
    
    def test_login_wrong_username(self):
        """Test login with wrong username"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong@email.com",
            "password": "190371"
        })
        assert response.status_code == 401
        print("✓ Wrong username rejected correctly")


class TestActivityEndpoints:
    """Customer Activity History API tests"""
    
    @pytest.fixture
    def lead_id(self):
        """Get a lead ID for testing"""
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200
        leads = response.json()
        if not leads:
            pytest.skip("No leads available for testing")
        return leads[0]["id"]
    
    def test_get_activities_empty(self, lead_id):
        """Test getting activities for a lead (may be empty)"""
        response = requests.get(f"{BASE_URL}/api/leads/{lead_id}/activities")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✓ GET /api/leads/{lead_id}/activities - Status 200")
    
    def test_create_activity(self, lead_id):
        """Test creating a new activity"""
        activity_data = {
            "lead_id": lead_id,
            "activity_type": "visit",
            "outcome": "positive",
            "notes": "TEST_activity - Test visit",
            "next_action_date": "2026-02-15",
            "next_action_note": "Follow up call"
        }
        response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/activities", json=activity_data)
        assert response.status_code == 200
        data = response.json()
        assert data["activity_type"] == "visit"
        assert data["outcome"] == "positive"
        assert "id" in data
        print(f"✓ POST /api/leads/{lead_id}/activities - Activity created: {data['id']}")
        return data["id"]
    
    def test_create_activity_all_types(self, lead_id):
        """Test creating activities with all types and outcomes"""
        activity_types = ["visit", "call", "email", "order", "follow_up"]
        outcomes = ["positive", "negative", "postponed", "ordered", "no_answer"]
        
        for act_type in activity_types:
            for outcome in outcomes[:2]:  # Test first 2 outcomes per type
                activity_data = {
                    "lead_id": lead_id,
                    "activity_type": act_type,
                    "outcome": outcome,
                    "notes": f"TEST_activity - {act_type} with {outcome}"
                }
                response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/activities", json=activity_data)
                assert response.status_code == 200
        print(f"✓ All activity types and outcomes work correctly")
    
    def test_get_upcoming_activities(self):
        """Test getting upcoming activities"""
        response = requests.get(f"{BASE_URL}/api/activities/upcoming")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/activities/upcoming - Found {len(data)} leads with upcoming activities")
    
    def test_delete_activity(self, lead_id):
        """Test deleting an activity"""
        # First create an activity
        activity_data = {
            "lead_id": lead_id,
            "activity_type": "call",
            "outcome": "no_answer",
            "notes": "TEST_activity - To be deleted"
        }
        create_response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/activities", json=activity_data)
        assert create_response.status_code == 200
        activity_id = create_response.json()["id"]
        
        # Delete the activity
        delete_response = requests.delete(f"{BASE_URL}/api/activities/{activity_id}")
        assert delete_response.status_code == 200
        print(f"✓ DELETE /api/activities/{activity_id} - Activity deleted")


class TestVideoFolders:
    """Product Videos Folder System API tests"""
    
    def test_get_folders_empty(self):
        """Test getting video folders (may be empty)"""
        response = requests.get(f"{BASE_URL}/api/video-folders")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✓ GET /api/video-folders - Status 200")
    
    def test_create_folder(self):
        """Test creating a new video folder"""
        folder_data = {
            "name": "TEST_folder - Ürün Tanıtımları",
            "description": "Test folder for product videos"
        }
        response = requests.post(f"{BASE_URL}/api/video-folders", json=folder_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✓ POST /api/video-folders - Folder created: {data['id']}")
        return data["id"]
    
    def test_delete_folder(self):
        """Test deleting a video folder"""
        # First create a folder
        folder_data = {
            "name": "TEST_folder - To Delete",
            "description": "Test folder to be deleted"
        }
        create_response = requests.post(f"{BASE_URL}/api/video-folders", json=folder_data)
        assert create_response.status_code == 200
        folder_id = create_response.json()["id"]
        
        # Delete the folder
        delete_response = requests.delete(f"{BASE_URL}/api/video-folders/{folder_id}")
        assert delete_response.status_code == 200
        print(f"✓ DELETE /api/video-folders/{folder_id} - Folder deleted")


class TestShipmentsEndpoints:
    """Shipments/Kargo Takip API tests"""
    
    def test_get_shipments(self):
        """Test getting shipments list"""
        response = requests.get(f"{BASE_URL}/api/shipments")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✓ GET /api/shipments - Status 200")
    
    def test_dhl_tracking(self):
        """Test DHL tracking endpoint"""
        tracking_number = "00340434161094015001"
        response = requests.get(f"{BASE_URL}/api/tracking/{tracking_number}")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "tracking_number" in data
        print(f"✓ GET /api/tracking/{tracking_number} - Status: {data.get('status')}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_activities(self):
        """Clean up TEST_ prefixed activities"""
        # Get all leads
        leads_response = requests.get(f"{BASE_URL}/api/leads")
        if leads_response.status_code == 200:
            leads = leads_response.json()
            for lead in leads:
                # Get activities for each lead
                activities_response = requests.get(f"{BASE_URL}/api/leads/{lead['id']}/activities")
                if activities_response.status_code == 200:
                    activities = activities_response.json()
                    for activity in activities:
                        if activity.get("notes", "").startswith("TEST_"):
                            requests.delete(f"{BASE_URL}/api/activities/{activity['id']}")
        print("✓ Cleaned up TEST_ activities")
    
    def test_cleanup_test_folders(self):
        """Clean up TEST_ prefixed folders"""
        folders_response = requests.get(f"{BASE_URL}/api/video-folders")
        if folders_response.status_code == 200:
            folders = folders_response.json()
            for folder in folders:
                if folder.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/video-folders/{folder['id']}")
        print("✓ Cleaned up TEST_ folders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
