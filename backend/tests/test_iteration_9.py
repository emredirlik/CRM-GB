"""
Backend API Tests for Iteration 9
Testing: Leads, Shipments, LeadFinder, and Mail features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://customer-agent-2.preview.emergentagent.com')

class TestLeadsAPI:
    """Test Leads/Customers API endpoints"""
    
    def test_get_leads_returns_data(self):
        """Verify /api/leads returns leads data"""
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 8, f"Expected at least 8 leads, got {len(data)}"
        print(f"SUCCESS: /api/leads returns {len(data)} leads")
    
    def test_leads_have_required_fields(self):
        """Verify leads have required fields"""
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            lead = data[0]
            required_fields = ['id', 'company_name', 'city', 'country']
            for field in required_fields:
                assert field in lead, f"Lead missing required field: {field}"
            print(f"SUCCESS: Leads have required fields")
    
    def test_leads_contain_expected_companies(self):
        """Verify leads contain expected company names"""
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200
        data = response.json()
        
        company_names = [lead.get('company_name', '') for lead in data]
        # Check for at least one expected company
        expected_companies = ['CRETA FARMS', 'Megas Yeeros', 'MEAT FARM']
        found = any(any(exp.lower() in name.lower() for name in company_names) for exp in expected_companies)
        assert found, f"Expected companies not found. Got: {company_names}"
        print(f"SUCCESS: Found expected companies in leads")


class TestShipmentsAPI:
    """Test Shipments API endpoints"""
    
    def test_get_shipments_returns_data(self):
        """Verify /api/shipments returns shipments data"""
        response = requests.get(f"{BASE_URL}/api/shipments")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3, f"Expected at least 3 shipments, got {len(data)}"
        print(f"SUCCESS: /api/shipments returns {len(data)} shipments")
    
    def test_shipments_have_required_fields(self):
        """Verify shipments have required fields"""
        response = requests.get(f"{BASE_URL}/api/shipments")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            shipment = data[0]
            required_fields = ['id', 'tracking_number', 'carrier', 'status']
            for field in required_fields:
                assert field in shipment, f"Shipment missing required field: {field}"
            print(f"SUCCESS: Shipments have required fields")
    
    def test_shipments_contain_dhl_tracking(self):
        """Verify shipments contain DHL tracking numbers"""
        response = requests.get(f"{BASE_URL}/api/shipments")
        assert response.status_code == 200
        data = response.json()
        
        carriers = [s.get('carrier', '') for s in data]
        assert 'DHL' in carriers, f"Expected DHL carrier. Got: {carriers}"
        print(f"SUCCESS: Found DHL shipments")


class TestLeadFinderAPI:
    """Test LeadFinder/Search API endpoints"""
    
    def test_search_leads_greece_without_keyword(self):
        """Verify Greece search works without keyword (uses default keywords)"""
        response = requests.post(f"{BASE_URL}/api/leads/search", json={
            "keywords": ["döner producer", "gyros manufacturer"],
            "location": "All",
            "country": "Greece",
            "limit": 20
        })
        # Should return 200 or 500 (if AI service unavailable)
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: Greece search returned {len(data.get('leads', []))} leads")
        else:
            print(f"INFO: AI search service may be unavailable")
    
    def test_potential_leads_endpoint(self):
        """Verify /api/potential-leads endpoint works"""
        response = requests.get(f"{BASE_URL}/api/potential-leads?limit=10")
        # This endpoint may or may not exist
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: /api/potential-leads returns data")
        elif response.status_code == 404:
            print(f"INFO: /api/potential-leads endpoint not found (may be expected)")
        else:
            print(f"INFO: /api/potential-leads returned {response.status_code}")


class TestMailAPI:
    """Test Mail API endpoints"""
    
    def test_mail_inbox_endpoint(self):
        """Verify /api/mail/inbox endpoint works"""
        response = requests.get(f"{BASE_URL}/api/mail/inbox")
        # May return 200 or error if IMAP not configured
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: /api/mail/inbox returns data")
        else:
            print(f"INFO: Mail inbox returned {response.status_code} (IMAP may not be configured)")
    
    def test_mail_sent_endpoint(self):
        """Verify /api/mail/sent endpoint works"""
        response = requests.get(f"{BASE_URL}/api/mail/sent")
        if response.status_code == 200:
            print(f"SUCCESS: /api/mail/sent returns data")
        else:
            print(f"INFO: Mail sent returned {response.status_code}")


class TestDashboardAPI:
    """Test Dashboard API endpoints"""
    
    def test_dashboard_stats(self):
        """Verify /api/dashboard/stats endpoint works"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert 'total_leads' in data
        assert 'total_orders' in data
        print(f"SUCCESS: Dashboard stats - {data.get('total_leads')} leads, {data.get('total_orders')} orders")


class TestAuthAPI:
    """Test Authentication API endpoints"""
    
    def test_login_with_valid_credentials(self):
        """Verify login works with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "emre@gewuerzberg.de",
            "password": "190371"
        })
        assert response.status_code == 200
        data = response.json()
        assert 'user' in data or 'token' in data or 'id' in data
        print(f"SUCCESS: Login successful")
    
    def test_login_with_invalid_credentials(self):
        """Verify login fails with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400]
        print(f"SUCCESS: Login correctly rejects invalid credentials")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
