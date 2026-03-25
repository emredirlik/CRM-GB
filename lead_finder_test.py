#!/usr/bin/env python3
"""
Lead Finder API Testing Suite
Tests the new Lead Finder functionality specifically
"""

import requests
import sys
import json
import time
from datetime import datetime

class LeadFinderAPITester:
    def __init__(self, base_url="https://customer-agent-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

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

    def test_get_search_templates(self):
        """Test getting search templates"""
        return self.run_test("Get Search Templates", "GET", "leads/search/templates", 200)

    def test_search_leads(self):
        """Test AI-powered lead search"""
        search_data = {
            "keywords": ["gyros producer", "döner manufacturer"],
            "location": "Athens",
            "country": "Greece",
            "limit": 5
        }
        
        print("   Note: AI search may take 10-15 seconds...")
        success, response = self.run_test("Search for Leads", "POST", "leads/search", 200, search_data)
        
        if success:
            if 'leads' in response and 'total_found' in response:
                print(f"   Found {response['total_found']} leads")
                if response['leads']:
                    print(f"   First lead: {response['leads'][0].get('company_name', 'Unknown')}")
                return True, response
            else:
                print("   Warning: Response missing expected fields")
                return False, response
        
        return success, response

    def test_search_history(self):
        """Test getting search history"""
        return self.run_test("Get Search History", "GET", "leads/search/history", 200)

    def test_import_leads(self):
        """Test importing found leads"""
        # First do a search to get some leads
        search_data = {
            "keywords": ["kebab factory"],
            "location": "Berlin",
            "country": "Germany",
            "limit": 2
        }
        
        print("   Performing search first...")
        success, search_response = self.run_test("Search for Import Test", "POST", "leads/search", 200, search_data)
        
        if not success or not search_response.get('leads'):
            print("   ❌ Cannot test import - search failed or no leads found")
            return False, {}
        
        # Try to import the found leads
        leads_to_import = search_response['leads'][:1]  # Import just one lead
        
        success, response = self.run_test("Import Found Leads", "POST", "leads/import", 200, leads_to_import)
        
        if success:
            print(f"   Imported: {response.get('imported_count', 0)} leads")
            print(f"   Skipped: {response.get('skipped_count', 0)} duplicates")
        
        return success, response

    def run_all_tests(self):
        """Run all Lead Finder tests"""
        print("🚀 Starting Lead Finder API Testing Suite")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print("=" * 60)

        # Test search templates
        self.test_get_search_templates()
        
        # Test search history (should work even if empty)
        self.test_search_history()
        
        # Test AI search functionality
        self.test_search_leads()
        
        # Test import functionality
        self.test_import_leads()

        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Lead Finder Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Lead Finder tests passed!")
            return 0
        else:
            print("⚠️  Some Lead Finder tests failed. Check the output above for details.")
            return 1

def main():
    """Main function to run the test suite"""
    tester = LeadFinderAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())