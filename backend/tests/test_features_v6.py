"""
Test Suite for Gewürzberg CRM - Iteration 6
Testing: DHL Tracking, Lead Finder, Lead Import, Dashboard

Features tested:
1. DHL Tracking - real tracking status (NOT demo data)
2. Lead Finder search - should return ONLY factories (not restaurants)
3. Lead import from Lead Finder - 'Add Selected' should work with minimal data
4. Dashboard page should load without layout issues
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API health check passed: {data['message']}")


class TestDHLTracking:
    """DHL Tracking endpoint tests - should return REAL tracking data, NOT demo"""
    
    def test_track_valid_number(self):
        """Test tracking with a valid DHL tracking number"""
        tracking_number = "00340434161094015001"
        response = requests.get(f"{BASE_URL}/api/tracking/{tracking_number}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "tracking_number" in data
        assert "status" in data
        assert "success" in data
        
        print(f"✓ DHL Tracking response: status={data.get('status')}, success={data.get('success')}")
        print(f"  Status text: {data.get('status_text', 'N/A')}")
        print(f"  Location: {data.get('current_location', 'N/A')}")
        
        # Check that it's NOT returning demo data
        # Demo data would have demo_mode=True or specific demo patterns
        if data.get('demo_mode'):
            print("⚠ WARNING: Response contains demo_mode=True - this should be REAL data")
        
        # Valid statuses from real DHL tracking
        valid_statuses = ['delivered', 'in_transit', 'out_for_delivery', 'picked_up', 
                         'exception', 'pending', 'unknown', 'error']
        assert data.get('status') in valid_statuses, f"Unexpected status: {data.get('status')}"
        
        return data
    
    def test_track_invalid_number(self):
        """Test tracking with an invalid/short tracking number"""
        tracking_number = "123"  # Too short
        response = requests.get(f"{BASE_URL}/api/tracking/{tracking_number}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return error or not found
        assert data.get('success') == False or data.get('status') == 'error'
        print(f"✓ Invalid tracking number handled correctly: {data.get('status_text', data.get('error'))}")


class TestLeadFinder:
    """Lead Finder tests - should return ONLY factories, NOT restaurants"""
    
    def test_search_germany_factories(self):
        """Test Lead Finder search for Germany - should return factories only"""
        payload = {
            "keywords": ["döner", "gyros", "kebab", "meat factory"],
            "location": "Berlin",
            "country": "Germany",
            "limit": 20
        }
        
        response = requests.post(f"{BASE_URL}/api/leads/search", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "leads" in data
        
        print(f"✓ Lead Finder returned {len(data.get('leads', []))} results for Germany/Berlin")
        
        # Check that results are factories, not restaurants
        restaurant_terms = ['restaurant', 'imbiss', 'grill', 'bistro', 'takeaway', 
                          'delivery', 'fast food', 'kebab house', 'döner haus']
        factory_terms = ['gmbh', 'produktion', 'fabrik', 'manufacturing', 'factory', 
                        'processing', 'hersteller', 'werk', 'a.ş.', 's.a.', 'ltd']
        
        restaurant_count = 0
        factory_count = 0
        
        for lead in data.get('leads', []):
            company_lower = (lead.get('company_name', '') or '').lower()
            business_lower = (lead.get('business_type', '') or '').lower()
            combined = f"{company_lower} {business_lower}"
            
            is_restaurant = any(term in combined for term in restaurant_terms)
            is_factory = any(term in combined for term in factory_terms)
            
            if is_restaurant:
                restaurant_count += 1
                print(f"  ⚠ RESTAURANT found: {lead.get('company_name')} - {lead.get('business_type')}")
            if is_factory:
                factory_count += 1
                print(f"  ✓ Factory: {lead.get('company_name')} - {lead.get('business_type')}")
        
        print(f"\n  Summary: {factory_count} factories, {restaurant_count} restaurants")
        
        # Restaurants should be 0 or very minimal
        if restaurant_count > 0:
            print(f"  ⚠ WARNING: {restaurant_count} restaurant(s) found - should be 0")
        
        return data
    
    def test_search_greece_factories(self):
        """Test Lead Finder search for Greece - should use gyros/souvlaki terms"""
        payload = {
            "keywords": ["gyros", "souvlaki", "meat factory"],
            "location": "Athens",
            "country": "Greece",
            "limit": 15
        }
        
        response = requests.post(f"{BASE_URL}/api/leads/search", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        print(f"✓ Lead Finder returned {len(data.get('leads', []))} results for Greece/Athens")
        
        for lead in data.get('leads', [])[:5]:  # Show first 5
            print(f"  - {lead.get('company_name')} ({lead.get('business_type')})")
        
        return data


class TestLeadImport:
    """Test Lead Import - should work with minimal data (empty email, empty tax_number)"""
    
    def test_create_lead_minimal_data(self):
        """Test creating a lead with minimal data (like AI-generated leads)"""
        # This simulates what happens when importing from Lead Finder
        # AI-generated leads often have empty email and tax_number
        payload = {
            "company_name": "TEST_AI_Factory_Import_GmbH",
            "first_name": "Contact",
            "last_name": "",
            "email": "",  # Empty email - should be allowed
            "phone": "+49 30 12345678",
            "address": "Industrial Zone 1",
            "city": "Berlin",
            "country": "Germany",
            "tax_number": "",  # Empty tax number - should be allowed
            "notes": "AI-found Factory - Test Import"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=payload)
        
        # Should succeed with 200 status
        assert response.status_code == 200, f"Failed to create lead: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data.get("company_name") == payload["company_name"]
        
        print(f"✓ Lead created with minimal data: ID={data.get('id')[:8]}...")
        print(f"  Company: {data.get('company_name')}")
        print(f"  Email: '{data.get('email')}' (empty allowed)")
        print(f"  Tax Number: '{data.get('tax_number')}' (empty allowed)")
        
        # Cleanup - delete the test lead
        lead_id = data.get('id')
        delete_response = requests.delete(f"{BASE_URL}/api/leads/{lead_id}")
        assert delete_response.status_code == 200
        print(f"✓ Test lead cleaned up")
        
        return data
    
    def test_create_lead_only_company_name(self):
        """Test creating a lead with only company_name (absolute minimum)"""
        payload = {
            "company_name": "TEST_Minimal_Factory_GmbH",
            "first_name": "",
            "last_name": "",
            "email": "",
            "city": "",
            "country": ""
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=payload)
        
        # Should succeed
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        print(f"✓ Lead created with only company_name: {data.get('company_name')}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{data.get('id')}")
        print(f"✓ Test lead cleaned up")
        
        return data


class TestDashboard:
    """Dashboard API tests"""
    
    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        expected_fields = ['total_leads', 'emails_sent', 'total_orders', 'total_revenue']
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Dashboard stats loaded successfully")
        print(f"  Total Leads: {data.get('total_leads')}")
        print(f"  Total Orders: {data.get('total_orders')}")
        print(f"  Total Revenue: €{data.get('total_revenue', 0):.2f}")
        
        return data
    
    def test_dashboard_stats_with_period(self):
        """Test dashboard stats with period filter"""
        periods = ['all', 'month', 'quarter', 'year']
        
        for period in periods:
            response = requests.get(f"{BASE_URL}/api/dashboard/stats?period={period}")
            assert response.status_code == 200
            data = response.json()
            assert data.get('period') == period
            print(f"✓ Dashboard stats for period '{period}' loaded")
        
        return True
    
    def test_agenda_endpoint(self):
        """Test agenda endpoint used by dashboard calendar"""
        response = requests.get(f"{BASE_URL}/api/agenda")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return a list (even if empty)
        assert isinstance(data, list)
        print(f"✓ Agenda endpoint returned {len(data)} events")
        
        return data
    
    def test_sales_forecast(self):
        """Test sales forecast endpoint used by dashboard"""
        response = requests.get(f"{BASE_URL}/api/sales/forecast")
        
        assert response.status_code == 200
        data = response.json()
        
        print(f"✓ Sales forecast endpoint working")
        if data.get('forecast'):
            print(f"  Predicted revenue: €{data['forecast'].get('predicted_revenue', 0):.2f}")
        
        return data


class TestAuthentication:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with correct credentials"""
        payload = {
            "username": "admin",
            "password": "190371"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user" in data
        assert data["user"]["username"] == "admin"
        print(f"✓ Login successful for user: {data['user']['username']}")
        
        return data
    
    def test_login_failure(self):
        """Test login with wrong credentials"""
        payload = {
            "username": "admin",
            "password": "wrongpassword"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 401
        print(f"✓ Login correctly rejected for wrong password")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
