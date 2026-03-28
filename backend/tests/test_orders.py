"""
Test suite for Orders API - Multi-product order functionality
Tests: CRUD operations, multi-product support, price calculations, PDF generation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://customer-agent-2.preview.emergentagent.com')

class TestOrdersAPI:
    """Test Orders API endpoints with multi-product support"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_order_ids = []
        self.created_lead_id = None
        yield
        # Cleanup created orders
        for order_id in self.created_order_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/orders/{order_id}")
            except:
                pass
        # Cleanup created lead
        if self.created_lead_id:
            try:
                self.session.delete(f"{BASE_URL}/api/leads/{self.created_lead_id}")
            except:
                pass
    
    def test_api_health(self):
        """Test API is running"""
        response = self.session.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ API health check passed")
    
    def test_get_orders_list(self):
        """Test GET /api/orders returns list"""
        response = self.session.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/orders returned {len(data)} orders")
    
    def test_get_leads_list(self):
        """Test GET /api/leads returns list (needed for order creation)"""
        response = self.session.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/leads returned {len(data)} leads")
        return data
    
    def test_create_lead_for_order(self):
        """Create a test lead for order testing"""
        lead_payload = {
            "first_name": "TEST_Order",
            "last_name": "Customer",
            "company_name": "TEST_Order Company GmbH",
            "tax_number": "DE123456789",
            "address": "Test Street 123",
            "email": "test_order@example.com",
            "city": "Berlin",
            "country": "Germany",
            "notes": "Test lead for order testing"
        }
        response = self.session.post(f"{BASE_URL}/api/leads", json=lead_payload)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        self.created_lead_id = data["id"]
        print(f"✓ Created test lead: {data['id']}")
        return data["id"]
    
    def test_create_single_product_order(self):
        """Test creating order with single product (legacy format)"""
        # First create a lead
        lead_id = self.test_create_lead_for_order()
        
        order_payload = {
            "lead_id": lead_id,
            "products": [
                {
                    "product_name": "TEST_Gyros Baharat",
                    "product_code": "TEST-GYR-001",
                    "pieces": 2,
                    "amount": 5.0,
                    "unit": "kg",
                    "unit_price": 12.50
                }
            ],
            "notes": "Test single product order"
        }
        
        response = self.session.post(f"{BASE_URL}/api/orders", json=order_payload)
        assert response.status_code == 200, f"Failed to create order: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "products" in data
        assert "total_price" in data
        
        # Verify price calculation: 2 pieces × 5 kg × €12.50 = €125.00
        expected_total = 2 * 5.0 * 12.50
        assert data["total_price"] == expected_total, f"Expected {expected_total}, got {data['total_price']}"
        
        self.created_order_ids.append(data["id"])
        print(f"✓ Created single product order: {data['id']}, total: €{data['total_price']}")
        return data
    
    def test_create_multi_product_order(self):
        """Test creating order with multiple products"""
        # First create a lead
        lead_id = self.test_create_lead_for_order()
        
        order_payload = {
            "lead_id": lead_id,
            "products": [
                {
                    "product_name": "TEST_Döner Baharat",
                    "product_code": "TEST-DON-001",
                    "pieces": 3,
                    "amount": 2.0,
                    "unit": "kg",
                    "unit_price": 15.00
                },
                {
                    "product_name": "TEST_Kebab Baharat",
                    "product_code": "TEST-KEB-001",
                    "pieces": 1,
                    "amount": 10.0,
                    "unit": "kg",
                    "unit_price": 8.00
                },
                {
                    "product_name": "TEST_Souvlaki Mix",
                    "product_code": "TEST-SOU-001",
                    "pieces": 2,
                    "amount": 5.0,
                    "unit": "kg",
                    "unit_price": 10.00
                }
            ],
            "notes": "Test multi-product order"
        }
        
        response = self.session.post(f"{BASE_URL}/api/orders", json=order_payload)
        assert response.status_code == 200, f"Failed to create order: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "products" in data
        assert len(data["products"]) == 3, f"Expected 3 products, got {len(data['products'])}"
        
        # Verify total price calculation:
        # Product 1: 3 × 2 × 15 = 90
        # Product 2: 1 × 10 × 8 = 80
        # Product 3: 2 × 5 × 10 = 100
        # Total: 270
        expected_total = (3 * 2.0 * 15.00) + (1 * 10.0 * 8.00) + (2 * 5.0 * 10.00)
        assert data["total_price"] == expected_total, f"Expected {expected_total}, got {data['total_price']}"
        
        # Verify each product has subtotal
        for product in data["products"]:
            assert "subtotal" in product, "Product missing subtotal"
            assert product["subtotal"] > 0, "Product subtotal should be > 0"
        
        self.created_order_ids.append(data["id"])
        print(f"✓ Created multi-product order: {data['id']}, {len(data['products'])} products, total: €{data['total_price']}")
        return data
    
    def test_get_order_by_id(self):
        """Test GET /api/orders/{order_id}"""
        # Create an order first
        order = self.test_create_single_product_order()
        order_id = order["id"]
        
        # Fetch the order
        response = self.session.get(f"{BASE_URL}/api/orders/{order_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == order_id
        assert "products" in data
        assert "total_price" in data
        print(f"✓ GET /api/orders/{order_id} returned order successfully")
    
    def test_update_order_status(self):
        """Test updating order status"""
        # Create an order first
        order = self.test_create_single_product_order()
        order_id = order["id"]
        
        # Update status
        update_payload = {"status": "confirmed"}
        response = self.session.put(f"{BASE_URL}/api/orders/{order_id}", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "confirmed"
        print(f"✓ Updated order status to 'confirmed'")
    
    def test_update_order_products(self):
        """Test updating order with new products"""
        # Create an order first
        order = self.test_create_single_product_order()
        order_id = order["id"]
        
        # Update with new products
        update_payload = {
            "products": [
                {
                    "product_name": "TEST_Updated Product",
                    "product_code": "TEST-UPD-001",
                    "pieces": 4,
                    "amount": 3.0,
                    "unit": "kg",
                    "unit_price": 20.00
                }
            ],
            "status": "confirmed"
        }
        
        response = self.session.put(f"{BASE_URL}/api/orders/{order_id}", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify new total: 4 × 3 × 20 = 240
        expected_total = 4 * 3.0 * 20.00
        assert data["total_price"] == expected_total, f"Expected {expected_total}, got {data['total_price']}"
        assert data["status"] == "confirmed"
        print(f"✓ Updated order products, new total: €{data['total_price']}")
    
    def test_delete_order(self):
        """Test DELETE /api/orders/{order_id}"""
        # Create an order first
        order = self.test_create_single_product_order()
        order_id = order["id"]
        
        # Delete the order
        response = self.session.delete(f"{BASE_URL}/api/orders/{order_id}")
        assert response.status_code == 200
        
        # Verify it's deleted
        response = self.session.get(f"{BASE_URL}/api/orders/{order_id}")
        assert response.status_code == 404
        
        # Remove from cleanup list since already deleted
        self.created_order_ids.remove(order_id)
        print(f"✓ Deleted order {order_id} successfully")
    
    def test_order_pdf_download(self):
        """Test PDF generation for order"""
        # Create an order first
        order = self.test_create_multi_product_order()
        order_id = order["id"]
        
        # Download PDF
        response = self.session.get(f"{BASE_URL}/api/orders/{order_id}/pdf")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 0
        print(f"✓ PDF download successful, size: {len(response.content)} bytes")
    
    def test_order_not_found(self):
        """Test 404 for non-existent order"""
        response = self.session.get(f"{BASE_URL}/api/orders/non-existent-id")
        assert response.status_code == 404
        print("✓ 404 returned for non-existent order")
    
    def test_create_order_invalid_lead(self):
        """Test creating order with invalid lead_id"""
        order_payload = {
            "lead_id": "invalid-lead-id",
            "products": [
                {
                    "product_name": "Test Product",
                    "product_code": "TEST-001",
                    "pieces": 1,
                    "amount": 1.0,
                    "unit": "kg",
                    "unit_price": 10.00
                }
            ]
        }
        
        response = self.session.post(f"{BASE_URL}/api/orders", json=order_payload)
        assert response.status_code == 404
        print("✓ 404 returned for invalid lead_id")


class TestOrdersIntegration:
    """Integration tests for orders with leads"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_order_ids = []
        self.created_lead_id = None
        yield
        # Cleanup
        for order_id in self.created_order_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/orders/{order_id}")
            except:
                pass
        if self.created_lead_id:
            try:
                self.session.delete(f"{BASE_URL}/api/leads/{self.created_lead_id}")
            except:
                pass
    
    def test_order_shows_lead_info(self):
        """Test that order contains lead company and name info"""
        # Create lead
        lead_payload = {
            "first_name": "TEST_Integration",
            "last_name": "User",
            "company_name": "TEST_Integration Company",
            "tax_number": "DE999999999",
            "address": "Integration Street 1",
            "email": "integration@test.com",
            "city": "Munich",
            "country": "Germany"
        }
        lead_response = self.session.post(f"{BASE_URL}/api/leads", json=lead_payload)
        assert lead_response.status_code == 200
        lead = lead_response.json()
        self.created_lead_id = lead["id"]
        
        # Create order
        order_payload = {
            "lead_id": lead["id"],
            "products": [
                {
                    "product_name": "TEST_Integration Product",
                    "product_code": "TEST-INT-001",
                    "pieces": 1,
                    "amount": 1.0,
                    "unit": "kg",
                    "unit_price": 10.00
                }
            ]
        }
        order_response = self.session.post(f"{BASE_URL}/api/orders", json=order_payload)
        assert order_response.status_code == 200
        order = order_response.json()
        self.created_order_ids.append(order["id"])
        
        # Verify lead info in order
        assert order["company_name"] == "TEST_Integration Company"
        assert order["lead_name"] == "TEST_Integration User"
        print(f"✓ Order contains correct lead info: {order['company_name']}, {order['lead_name']}")
    
    def test_get_orders_by_lead(self):
        """Test GET /api/orders/lead/{lead_id}"""
        # Create lead
        lead_payload = {
            "first_name": "TEST_LeadOrders",
            "last_name": "Test",
            "company_name": "TEST_LeadOrders Company",
            "tax_number": "DE888888888",
            "address": "Lead Orders Street 1",
            "email": "leadorders@test.com",
            "city": "Hamburg",
            "country": "Germany"
        }
        lead_response = self.session.post(f"{BASE_URL}/api/leads", json=lead_payload)
        assert lead_response.status_code == 200
        lead = lead_response.json()
        self.created_lead_id = lead["id"]
        
        # Create 2 orders for this lead
        for i in range(2):
            order_payload = {
                "lead_id": lead["id"],
                "products": [
                    {
                        "product_name": f"TEST_Product {i+1}",
                        "product_code": f"TEST-PRD-{i+1:03d}",
                        "pieces": 1,
                        "amount": 1.0,
                        "unit": "kg",
                        "unit_price": 10.00 * (i + 1)
                    }
                ]
            }
            order_response = self.session.post(f"{BASE_URL}/api/orders", json=order_payload)
            assert order_response.status_code == 200
            self.created_order_ids.append(order_response.json()["id"])
        
        # Get orders by lead
        response = self.session.get(f"{BASE_URL}/api/orders/lead/{lead['id']}")
        assert response.status_code == 200
        orders = response.json()
        assert len(orders) >= 2
        print(f"✓ GET /api/orders/lead/{lead['id']} returned {len(orders)} orders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
