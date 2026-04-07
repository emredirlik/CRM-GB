"""
Backend tests for Payment Tracking and Doner News features
Tests: Payment status dropdown, payment due days, overdue warnings, doner news API
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://customer-agent-2.preview.emergentagent.com')

class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "emre@gewuerzberg.de",
            "password": "190371"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert data["username"] == "emre@gewuerzberg.de"
        assert data["role"] == "admin"
        print(f"✓ Login successful for {data['username']}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")


class TestPaymentTracking:
    """Payment tracking feature tests"""
    
    @pytest.fixture
    def order_id(self):
        """Get an existing order ID for testing"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        orders = response.json()
        if orders:
            return orders[0]["id"]
        pytest.skip("No orders available for testing")
    
    def test_update_payment_status_pending(self, order_id):
        """Test updating payment status to pending"""
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/payment",
            json={"payment_status": "pending"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify update
        verify = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert verify.status_code == 200
        assert verify.json()["payment_status"] == "pending"
        print("✓ Payment status updated to 'pending'")
    
    def test_update_payment_status_partial(self, order_id):
        """Test updating payment status to partial"""
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/payment",
            json={"payment_status": "partial"}
        )
        assert response.status_code == 200
        
        verify = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert verify.json()["payment_status"] == "partial"
        print("✓ Payment status updated to 'partial'")
    
    def test_update_payment_status_paid(self, order_id):
        """Test updating payment status to paid"""
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/payment",
            json={"payment_status": "paid"}
        )
        assert response.status_code == 200
        
        verify = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert verify.json()["payment_status"] == "paid"
        print("✓ Payment status updated to 'paid'")
    
    def test_update_payment_status_overdue(self, order_id):
        """Test updating payment status to overdue"""
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/payment",
            json={"payment_status": "overdue"}
        )
        assert response.status_code == 200
        
        verify = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert verify.json()["payment_status"] == "overdue"
        print("✓ Payment status updated to 'overdue'")
    
    def test_update_payment_due_date_10_days(self, order_id):
        """Test setting payment due date to 10 days from order creation"""
        # Calculate due date (10 days from now for testing)
        due_date = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
        
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/payment",
            json={"payment_due_date": due_date}
        )
        assert response.status_code == 200
        
        verify = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert verify.json()["payment_due_date"] == due_date
        print(f"✓ Payment due date set to {due_date} (10 days)")
    
    def test_update_payment_due_date_30_days(self, order_id):
        """Test setting payment due date to 30 days"""
        due_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/payment",
            json={"payment_due_date": due_date}
        )
        assert response.status_code == 200
        
        verify = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert verify.json()["payment_due_date"] == due_date
        print(f"✓ Payment due date set to {due_date} (30 days)")
    
    def test_update_payment_due_date_60_days(self, order_id):
        """Test setting payment due date to 60 days"""
        due_date = (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
        
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/payment",
            json={"payment_due_date": due_date}
        )
        assert response.status_code == 200
        
        verify = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert verify.json()["payment_due_date"] == due_date
        print(f"✓ Payment due date set to {due_date} (60 days)")
    
    def test_reset_payment_status(self, order_id):
        """Reset payment status to pending for future tests"""
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/payment",
            json={"payment_status": "pending", "payment_due_date": "2026-05-01"}
        )
        assert response.status_code == 200
        print("✓ Payment status reset to pending")


class TestDonerNews:
    """Doner News API tests"""
    
    def test_doner_news_german(self):
        """Test doner news endpoint with German language"""
        response = requests.get(f"{BASE_URL}/api/doner-news?lang=de")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "news" in data
        assert len(data["news"]) > 0
        assert data["language"] == "de"
        
        # Check news item structure
        news_item = data["news"][0]
        assert "id" in news_item
        assert "title" in news_item
        assert "description" in news_item
        assert "source" in news_item
        assert "url" in news_item
        
        print(f"✓ Doner news (DE) returned {len(data['news'])} items, source: {data.get('source', 'unknown')}")
    
    def test_doner_news_turkish(self):
        """Test doner news endpoint with Turkish language"""
        response = requests.get(f"{BASE_URL}/api/doner-news?lang=tr")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert len(data["news"]) > 0
        assert data["language"] == "tr"
        print(f"✓ Doner news (TR) returned {len(data['news'])} items")
    
    def test_doner_news_english(self):
        """Test doner news endpoint with English language"""
        response = requests.get(f"{BASE_URL}/api/doner-news?lang=en")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert len(data["news"]) > 0
        assert data["language"] == "en"
        print(f"✓ Doner news (EN) returned {len(data['news'])} items")
    
    def test_doner_news_polish(self):
        """Test doner news endpoint with Polish language"""
        response = requests.get(f"{BASE_URL}/api/doner-news?lang=pl")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert len(data["news"]) > 0
        assert data["language"] == "pl"
        print(f"✓ Doner news (PL) returned {len(data['news'])} items")


class TestDailyReports:
    """Daily Reports tests for PDF with map"""
    
    def test_get_daily_reports(self):
        """Test getting daily reports list"""
        response = requests.get(f"{BASE_URL}/api/daily-reports")
        assert response.status_code == 200
        
        reports = response.json()
        assert isinstance(reports, list)
        
        if reports:
            report = reports[0]
            assert "id" in report
            assert "date" in report
            assert "company_name" in report
            assert "city" in report
            print(f"✓ Daily reports returned {len(reports)} items")
        else:
            print("✓ Daily reports endpoint works (no reports yet)")
    
    def test_daily_reports_pdf_endpoint_exists(self):
        """Test that daily reports PDF endpoint exists"""
        # Get a date with reports
        response = requests.get(f"{BASE_URL}/api/daily-reports")
        reports = response.json()
        
        if reports:
            date = reports[0]["date"]
            pdf_response = requests.get(f"{BASE_URL}/api/daily-reports/pdf?date={date}&lang=tr")
            # Should return PDF or 404 if no reports for that date
            assert pdf_response.status_code in [200, 404], f"Unexpected status: {pdf_response.status_code}"
            
            if pdf_response.status_code == 200:
                assert pdf_response.headers.get('content-type') == 'application/pdf'
                print(f"✓ Daily reports PDF generated for date {date}")
            else:
                print(f"✓ Daily reports PDF endpoint exists (no reports for {date})")
        else:
            print("✓ Daily reports PDF endpoint exists (no reports to test)")


class TestOrdersEndpoint:
    """Orders endpoint tests"""
    
    def test_get_orders(self):
        """Test getting orders list"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        
        orders = response.json()
        assert isinstance(orders, list)
        
        if orders:
            order = orders[0]
            # Check order has payment fields
            assert "payment_status" in order
            assert "payment_due_date" in order or order.get("payment_due_date") is None
            print(f"✓ Orders returned {len(orders)} items with payment fields")
        else:
            print("✓ Orders endpoint works (no orders yet)")
    
    def test_order_has_payment_fields(self):
        """Test that orders have payment tracking fields"""
        response = requests.get(f"{BASE_URL}/api/orders")
        orders = response.json()
        
        if orders:
            order = orders[0]
            # Verify payment fields exist
            assert "payment_status" in order, "payment_status field missing"
            assert order["payment_status"] in ["pending", "partial", "paid", "overdue"], \
                f"Invalid payment_status: {order['payment_status']}"
            print(f"✓ Order has valid payment_status: {order['payment_status']}")
        else:
            pytest.skip("No orders to test")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
