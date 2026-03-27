"""
Backend API Tests for New Features:
1. Specifications - PDF text extraction and regeneration
2. Route Planner - Geocoding with predefined city coordinates
3. Dashboard - Visit Planning / Agenda endpoints
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSpecificationsPDFFeatures:
    """Tests for PDF text extraction and regeneration in Specifications"""
    
    # Test PDF ID provided by main agent
    TEST_SPEC_ID = "ae81d961-3480-41ff-81db-9d5119032498"
    
    def test_get_specifications_list(self):
        """Test GET /api/specifications returns list"""
        response = requests.get(f"{BASE_URL}/api/specifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"✓ GET /api/specifications - Found {len(data)} specifications")
    
    def test_get_specification_by_id(self):
        """Test GET /api/specifications/{id} returns spec details"""
        response = requests.get(f"{BASE_URL}/api/specifications/{self.TEST_SPEC_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "id" in data, "Response should contain id"
        assert "filename" in data, "Response should contain filename"
        print(f"✓ GET /api/specifications/{self.TEST_SPEC_ID} - Found: {data.get('name')}")
    
    def test_get_specification_text(self):
        """Test GET /api/specifications/{id}/text returns extracted text"""
        response = requests.get(f"{BASE_URL}/api/specifications/{self.TEST_SPEC_ID}/text")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify text extraction fields
        assert "extracted_text" in data, "Response should contain extracted_text"
        assert "edited_text" in data, "Response should contain edited_text"
        assert "has_original_pdf" in data, "Response should contain has_original_pdf"
        
        # Verify text content exists
        assert len(data.get("extracted_text", "")) > 0, "extracted_text should not be empty"
        print(f"✓ GET /api/specifications/{self.TEST_SPEC_ID}/text - Text length: {len(data.get('extracted_text', ''))}")
    
    def test_update_specification_text(self):
        """Test PUT /api/specifications/{id}/text updates edited text"""
        # First get current text
        get_response = requests.get(f"{BASE_URL}/api/specifications/{self.TEST_SPEC_ID}/text")
        original_text = get_response.json().get("edited_text", "")
        
        # Update with modified text
        modified_text = original_text + "\n\n[TEST EDIT - AUTOMATED TEST]"
        response = requests.put(
            f"{BASE_URL}/api/specifications/{self.TEST_SPEC_ID}/text",
            data={"edited_text": modified_text}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/specifications/{self.TEST_SPEC_ID}/text")
        assert "[TEST EDIT - AUTOMATED TEST]" in verify_response.json().get("edited_text", "")
        
        # Restore original text
        requests.put(
            f"{BASE_URL}/api/specifications/{self.TEST_SPEC_ID}/text",
            data={"edited_text": original_text}
        )
        print(f"✓ PUT /api/specifications/{self.TEST_SPEC_ID}/text - Text updated and restored")
    
    def test_regenerate_pdf_from_text(self):
        """Test GET /api/specifications/{id}/regenerate-pdf generates PDF"""
        response = requests.get(f"{BASE_URL}/api/specifications/{self.TEST_SPEC_ID}/regenerate-pdf")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify PDF content type
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Expected PDF content type, got {content_type}"
        
        # Verify PDF content starts with PDF header
        assert response.content[:4] == b'%PDF', "Response should be valid PDF"
        print(f"✓ GET /api/specifications/{self.TEST_SPEC_ID}/regenerate-pdf - PDF generated ({len(response.content)} bytes)")
    
    def test_download_original_pdf(self):
        """Test GET /api/specifications/{id}/download returns original PDF"""
        response = requests.get(f"{BASE_URL}/api/specifications/{self.TEST_SPEC_ID}/download")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Expected PDF content type, got {content_type}"
        print(f"✓ GET /api/specifications/{self.TEST_SPEC_ID}/download - Original PDF downloaded")


class TestGeocodeWithPredefinedCoords:
    """Tests for Route Planner geocoding with predefined city coordinates"""
    
    def test_geocode_search_berlin(self):
        """Test geocode search returns cached Berlin coordinates"""
        response = requests.get(f"{BASE_URL}/api/geocode/search", params={"q": "Berlin"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Expected list response"
        assert len(data) > 0, "Should return at least one result"
        
        result = data[0]
        assert "lat" in result, "Result should contain lat"
        assert "lon" in result, "Result should contain lon"
        assert "display_name" in result, "Result should contain display_name"
        
        # Verify Berlin coordinates (approximately)
        lat = float(result["lat"])
        lon = float(result["lon"])
        assert 52.0 < lat < 53.0, f"Berlin lat should be ~52.52, got {lat}"
        assert 13.0 < lon < 14.0, f"Berlin lon should be ~13.40, got {lon}"
        
        # Check if cached
        assert "(cached)" in result.get("display_name", ""), "Berlin should be from cache"
        print(f"✓ GET /api/geocode/search?q=Berlin - Cached: {result['display_name']}")
    
    def test_geocode_search_istanbul(self):
        """Test geocode search returns cached Istanbul coordinates"""
        response = requests.get(f"{BASE_URL}/api/geocode/search", params={"q": "Istanbul"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert len(data) > 0, "Should return at least one result"
        result = data[0]
        
        lat = float(result["lat"])
        lon = float(result["lon"])
        assert 40.0 < lat < 42.0, f"Istanbul lat should be ~41.0, got {lat}"
        assert 28.0 < lon < 30.0, f"Istanbul lon should be ~28.97, got {lon}"
        print(f"✓ GET /api/geocode/search?q=Istanbul - Cached: {result['display_name']}")
    
    def test_geocode_search_athens(self):
        """Test geocode search returns cached Athens coordinates"""
        response = requests.get(f"{BASE_URL}/api/geocode/search", params={"q": "Athens"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert len(data) > 0, "Should return at least one result"
        result = data[0]
        
        lat = float(result["lat"])
        lon = float(result["lon"])
        assert 37.0 < lat < 39.0, f"Athens lat should be ~37.98, got {lat}"
        assert 23.0 < lon < 24.0, f"Athens lon should be ~23.72, got {lon}"
        print(f"✓ GET /api/geocode/search?q=Athens - Cached: {result['display_name']}")
    
    def test_geocode_search_short_query(self):
        """Test geocode search with short query returns empty"""
        response = requests.get(f"{BASE_URL}/api/geocode/search", params={"q": "Be"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data == [], "Short query should return empty list"
        print("✓ GET /api/geocode/search?q=Be - Returns empty for short query")
    
    def test_geocode_search_multiple_cities(self):
        """Test multiple predefined cities return cached results"""
        cities = ["Munich", "Hamburg", "Vienna", "Paris", "Amsterdam"]
        for city in cities:
            response = requests.get(f"{BASE_URL}/api/geocode/search", params={"q": city})
            assert response.status_code == 200, f"Failed for {city}"
            data = response.json()
            assert len(data) > 0, f"No results for {city}"
        print(f"✓ Tested {len(cities)} predefined cities - All returned results")


class TestAgendaVisitPlanning:
    """Tests for Dashboard Visit Planning / Agenda endpoints"""
    
    TEST_VISIT_ID = "bd78e89b-73bd-42b2-94c8-89a0726c7c66"
    
    def test_get_agenda_list(self):
        """Test GET /api/agenda returns list of events"""
        response = requests.get(f"{BASE_URL}/api/agenda")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"✓ GET /api/agenda - Found {len(data)} events")
    
    def test_get_agenda_event_structure(self):
        """Test agenda events have correct structure with new fields"""
        response = requests.get(f"{BASE_URL}/api/agenda")
        data = response.json()
        
        if len(data) > 0:
            event = data[0]
            # Check required fields
            assert "id" in event, "Event should have id"
            assert "title" in event, "Event should have title"
            assert "due_date" in event, "Event should have due_date"
            
            # Check new visit planning fields
            assert "event_type" in event, "Event should have event_type"
            print(f"✓ Agenda event structure verified - event_type: {event.get('event_type')}")
        else:
            print("⚠ No events to verify structure")
    
    def test_create_visit_event(self):
        """Test POST /api/agenda creates visit with event_type"""
        visit_data = {
            "title": "TEST_Visit - Automated Test",
            "due_date": "2026-04-01T10:00:00Z",
            "completed": False,
            "event_type": "visit",
            "lead_id": None,
            "time": "10:00",
            "notes": "Automated test visit"
        }
        
        response = requests.post(f"{BASE_URL}/api/agenda", json=visit_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "id" in data, "Response should contain id"
        assert data["event_type"] == "visit", "event_type should be 'visit'"
        assert data["title"] == visit_data["title"], "Title should match"
        assert data["time"] == "10:00", "Time should be preserved"
        
        # Cleanup - delete test event
        event_id = data["id"]
        delete_response = requests.delete(f"{BASE_URL}/api/agenda/{event_id}")
        assert delete_response.status_code == 200, "Cleanup delete should succeed"
        
        print(f"✓ POST /api/agenda - Created visit event with event_type='visit'")
    
    def test_create_meeting_event(self):
        """Test creating meeting event type"""
        meeting_data = {
            "title": "TEST_Meeting - Automated Test",
            "due_date": "2026-04-02T14:00:00Z",
            "completed": False,
            "event_type": "meeting",
            "time": "14:00",
            "notes": "Test meeting"
        }
        
        response = requests.post(f"{BASE_URL}/api/agenda", json=meeting_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data["event_type"] == "meeting", "event_type should be 'meeting'"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/agenda/{data['id']}")
        print(f"✓ POST /api/agenda - Created meeting event with event_type='meeting'")
    
    def test_create_call_event(self):
        """Test creating call event type"""
        call_data = {
            "title": "TEST_Call - Automated Test",
            "due_date": "2026-04-03T09:00:00Z",
            "completed": False,
            "event_type": "call",
            "time": "09:00"
        }
        
        response = requests.post(f"{BASE_URL}/api/agenda", json=call_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["event_type"] == "call", "event_type should be 'call'"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/agenda/{data['id']}")
        print(f"✓ POST /api/agenda - Created call event with event_type='call'")
    
    def test_create_delivery_event(self):
        """Test creating delivery event type"""
        delivery_data = {
            "title": "TEST_Delivery - Automated Test",
            "due_date": "2026-04-04T08:00:00Z",
            "completed": False,
            "event_type": "delivery",
            "time": "08:00"
        }
        
        response = requests.post(f"{BASE_URL}/api/agenda", json=delivery_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["event_type"] == "delivery", "event_type should be 'delivery'"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/agenda/{data['id']}")
        print(f"✓ POST /api/agenda - Created delivery event with event_type='delivery'")
    
    def test_update_agenda_event(self):
        """Test PUT /api/agenda/{id} updates event"""
        # Create test event
        create_response = requests.post(f"{BASE_URL}/api/agenda", json={
            "title": "TEST_Update - Original",
            "due_date": "2026-04-05T10:00:00Z",
            "event_type": "task"
        })
        event_id = create_response.json()["id"]
        
        # Update event
        update_response = requests.put(f"{BASE_URL}/api/agenda/{event_id}", json={
            "title": "TEST_Update - Modified",
            "completed": True
        })
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/agenda")
        events = get_response.json()
        updated_event = next((e for e in events if e["id"] == event_id), None)
        
        assert updated_event is not None, "Event should exist"
        assert updated_event["completed"] == True, "completed should be True"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/agenda/{event_id}")
        print(f"✓ PUT /api/agenda/{event_id} - Event updated successfully")
    
    def test_delete_agenda_event(self):
        """Test DELETE /api/agenda/{id} removes event"""
        # Create test event
        create_response = requests.post(f"{BASE_URL}/api/agenda", json={
            "title": "TEST_Delete - To Be Deleted",
            "due_date": "2026-04-06T10:00:00Z",
            "event_type": "task"
        })
        event_id = create_response.json()["id"]
        
        # Delete event
        delete_response = requests.delete(f"{BASE_URL}/api/agenda/{event_id}")
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/agenda")
        events = get_response.json()
        deleted_event = next((e for e in events if e["id"] == event_id), None)
        
        assert deleted_event is None, "Event should be deleted"
        print(f"✓ DELETE /api/agenda/{event_id} - Event deleted successfully")


class TestLeadsForVisitPlanning:
    """Test leads endpoint for visit planning customer selection"""
    
    def test_get_leads_list(self):
        """Test GET /api/leads returns list for customer selection"""
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        
        if len(data) > 0:
            lead = data[0]
            assert "id" in lead, "Lead should have id"
            assert "company_name" in lead, "Lead should have company_name"
        
        print(f"✓ GET /api/leads - Found {len(data)} leads for customer selection")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
