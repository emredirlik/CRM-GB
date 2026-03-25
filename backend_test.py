#!/usr/bin/env python3
"""
SpiceCRM Backend API Testing Suite
Tests all CRUD operations, email functionality, and AI integration
"""

import requests
import sys
import json
import time
from datetime import datetime

class SpiceCRMAPITester:
    def __init__(self, base_url="https://customer-agent-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_lead_id = None
        self.test_template_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_create_lead(self):
        """Test creating a new lead"""
        test_data = {
            "first_name": "Test",
            "last_name": "User",
            "company_name": "Test Company GmbH",
            "tax_number": "DE123456789",
            "address": "Test Street 123",
            "email": "test@testcompany.de",
            "city": "Berlin",
            "country": "Germany",
            "notes": "Test lead for API testing"
        }
        success, response = self.run_test("Create Lead", "POST", "leads", 200, test_data)
        if success and 'id' in response:
            self.test_lead_id = response['id']
            print(f"   Created lead with ID: {self.test_lead_id}")
        return success, response

    def test_get_leads(self):
        """Test getting all leads"""
        return self.run_test("Get All Leads", "GET", "leads", 200)

    def test_get_lead_by_id(self):
        """Test getting a specific lead by ID"""
        if not self.test_lead_id:
            print("❌ Skipped - No test lead ID available")
            return False, {}
        return self.run_test("Get Lead by ID", "GET", f"leads/{self.test_lead_id}", 200)

    def test_update_lead(self):
        """Test updating a lead"""
        if not self.test_lead_id:
            print("❌ Skipped - No test lead ID available")
            return False, {}
        
        update_data = {
            "notes": "Updated notes for testing",
            "city": "Munich"
        }
        return self.run_test("Update Lead", "PUT", f"leads/{self.test_lead_id}", 200, update_data)

    def test_create_template(self):
        """Test creating an email template"""
        template_data = {
            "name": "Test Template",
            "subject": "Partnership Opportunity - {company_name}",
            "body": "Dear {first_name} {last_name},\n\nWe would like to discuss a partnership opportunity with {company_name}.\n\nBest regards,\nBerlin Spice Factory",
            "language": "en"
        }
        success, response = self.run_test("Create Template", "POST", "templates", 200, template_data)
        if success and 'id' in response:
            self.test_template_id = response['id']
            print(f"   Created template with ID: {self.test_template_id}")
        return success, response

    def test_get_templates(self):
        """Test getting all templates"""
        return self.run_test("Get All Templates", "GET", "templates", 200)

    def test_get_template_by_id(self):
        """Test getting a specific template by ID"""
        if not self.test_template_id:
            print("❌ Skipped - No test template ID available")
            return False, {}
        return self.run_test("Get Template by ID", "GET", f"templates/{self.test_template_id}", 200)

    def test_smtp_settings(self):
        """Test SMTP settings endpoints"""
        # First get existing settings
        success, _ = self.run_test("Get SMTP Settings", "GET", "settings/smtp", 200)
        
        # Test saving SMTP settings
        smtp_data = {
            "host": "smtp.gmail.com",
            "port": 587,
            "username": "test@example.com",
            "password": "test_password",
            "from_email": "info@berlinspice.com",
            "from_name": "Berlin Spice Factory",
            "use_tls": True
        }
        success, _ = self.run_test("Save SMTP Settings", "POST", "settings/smtp", 200, smtp_data)
        
        # Test SMTP connection (this will likely fail with test credentials, but should return proper response)
        success, response = self.run_test("Test SMTP Connection", "POST", "settings/smtp/test", 200)
        return success, response

    def test_ai_email_generation(self):
        """Test AI email generation"""
        if not self.test_lead_id:
            print("❌ Skipped - No test lead ID available")
            return False, {}
        
        ai_request = {
            "lead_id": self.test_lead_id,
            "language": "en",
            "tone": "professional"
        }
        
        print("   Note: AI generation may take a few seconds...")
        success, response = self.run_test("Generate AI Email", "POST", "emails/generate", 200, ai_request)
        
        if success:
            if 'subject' in response and 'body' in response:
                print(f"   Generated subject: {response['subject'][:50]}...")
                print(f"   Generated body length: {len(response['body'])} characters")
            else:
                print("   Warning: Response missing subject or body")
        
        return success, response

    def test_email_history(self):
        """Test email history endpoints"""
        success, _ = self.run_test("Get Email History", "GET", "emails/history", 200)
        
        if self.test_lead_id:
            success, _ = self.run_test("Get Lead Email History", "GET", f"emails/history/{self.test_lead_id}", 200)
        
        return success, {}

    def test_send_email(self):
        """Test email sending (will queue but may fail without proper SMTP)"""
        if not self.test_lead_id:
            print("❌ Skipped - No test lead ID available")
            return False, {}
        
        email_data = {
            "lead_id": self.test_lead_id,
            "subject": "Test Email from SpiceCRM",
            "body": "This is a test email sent from the SpiceCRM API testing suite."
        }
        
        # This will queue the email but may fail to send without proper SMTP
        return self.run_test("Send Email", "POST", "emails/send", 200, email_data)

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        if self.test_lead_id:
            success, _ = self.run_test("Delete Test Lead", "DELETE", f"leads/{self.test_lead_id}", 200)
            if success:
                print(f"   Deleted test lead: {self.test_lead_id}")
        
        if self.test_template_id:
            success, _ = self.run_test("Delete Test Template", "DELETE", f"templates/{self.test_template_id}", 200)
            if success:
                print(f"   Deleted test template: {self.test_template_id}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SpiceCRM API Testing Suite")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print("=" * 60)

        # Basic connectivity tests
        self.test_root_endpoint()
        self.test_dashboard_stats()

        # Lead CRUD tests
        self.test_create_lead()
        self.test_get_leads()
        self.test_get_lead_by_id()
        self.test_update_lead()

        # Template tests
        self.test_create_template()
        self.test_get_templates()
        self.test_get_template_by_id()

        # SMTP and email tests
        self.test_smtp_settings()
        self.test_email_history()
        
        # AI integration test (may take longer)
        self.test_ai_email_generation()
        
        # Email sending test
        self.test_send_email()

        # Cleanup
        self.cleanup_test_data()

        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
            return 1

def main():
    """Main function to run the test suite"""
    tester = SpiceCRMAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())