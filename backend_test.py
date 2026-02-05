#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Cenny Grosz Finance App
Testing all authentication, wallet, transaction, goal, and AI assistant APIs
"""

import requests
import json
import sys
from datetime import datetime
import os
from typing import Dict, Optional, Any

# Get backend URL from frontend .env file
FRONTEND_ENV_PATH = "/app/frontend/.env"
BACKEND_URL = None

def get_backend_url():
    """Extract backend URL from frontend .env file"""
    global BACKEND_URL
    try:
        with open(FRONTEND_ENV_PATH, 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    BACKEND_URL = line.strip().split('=', 1)[1] + "/api"
                    return BACKEND_URL
        # Fallback to localhost
        BACKEND_URL = "http://localhost:8001/api"
        return BACKEND_URL
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        BACKEND_URL = "http://localhost:8001/api"
        return BACKEND_URL

# Initialize backend URL
BASE_URL = get_backend_url()

class TestRunner:
    def __init__(self):
        self.auth_token = None
        self.user_data = None
        self.test_results = []
        self.created_resources = {
            'wallets': [],
            'transactions': [],
            'goals': []
        }
        
        # Test user data
        self.test_user = {
            "email": "anna.kowalska@test.pl",
            "password": "TestoweHaslo2025!",
            "name": "Anna Kowalska"
        }
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        if response_data:
            result['response'] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    auth: bool = True, expected_status: int = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if auth and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
            
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            # Return mock response for connection errors
            class MockResponse:
                def __init__(self):
                    self.status_code = 0
                    self.text = f"Connection error: {str(e)}"
                def json(self):
                    return {"error": "connection_failed"}
            return MockResponse()

    # ================== AUTH TESTS ==================
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = self.make_request("GET", "/health", auth=False)
        
        if response.status_code == 200:
            data = response.json()
            self.log_test("API Health Check", True, f"API is healthy: {data}")
        else:
            self.log_test("API Health Check", False, f"Health check failed: {response.status_code} - {response.text}")

    def test_user_registration(self):
        """Test user registration and verify default wallet creation"""
        response = self.make_request("POST", "/auth/register", self.test_user, auth=False)
        
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data.get("access_token")
            self.user_data = data.get("user")
            
            # Verify response structure
            expected_fields = ["access_token", "token_type", "user"]
            if all(field in data for field in expected_fields):
                user = data["user"]
                user_fields = ["id", "email", "name", "created_at"]
                if all(field in user for field in user_fields):
                    self.log_test("User Registration", True, 
                                f"User registered successfully: {user['name']} ({user['email']})")
                    return True
                else:
                    self.log_test("User Registration", False, 
                                f"Missing user fields: {response.text}")
            else:
                self.log_test("User Registration", False, 
                            f"Missing response fields: {response.text}")
        elif response.status_code == 400:
            # User might already exist, try login instead
            self.log_test("User Registration", True, 
                        "User already exists (expected), will try login")
            return True
        else:
            self.log_test("User Registration", False, 
                        f"Registration failed: {response.status_code} - {response.text}")
        return False

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        response = self.make_request("POST", "/auth/login", login_data, auth=False)
        
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data.get("access_token")
            self.user_data = data.get("user")
            
            if self.auth_token and self.user_data:
                self.log_test("User Login", True, 
                            f"Login successful for: {self.user_data['name']}")
                return True
            else:
                self.log_test("User Login", False, "Missing token or user data in response")
        else:
            self.log_test("User Login", False, 
                        f"Login failed: {response.status_code} - {response.text}")
        return False

    def test_get_current_user(self):
        """Test get current user endpoint"""
        response = self.make_request("GET", "/auth/me")
        
        if response.status_code == 200:
            data = response.json()
            expected_fields = ["id", "email", "name", "created_at"]
            if all(field in data for field in expected_fields):
                self.log_test("Get Current User", True, 
                            f"User info retrieved: {data['name']} ({data['email']})")
                return True
            else:
                self.log_test("Get Current User", False, 
                            f"Missing user fields: {response.text}")
        else:
            self.log_test("Get Current User", False, 
                        f"Get user failed: {response.status_code} - {response.text}")
        return False

    # ================== WALLET TESTS ==================
    
    def test_get_default_wallet(self):
        """Test that default wallet was created during registration"""
        response = self.make_request("GET", "/wallets")
        
        if response.status_code == 200:
            wallets = response.json()
            if isinstance(wallets, list) and len(wallets) > 0:
                default_wallet = wallets[0]
                if default_wallet.get("name") == "Mój portfel":
                    self.log_test("Default Wallet Creation", True, 
                                f"Default wallet found: {default_wallet['name']} (Balance: {default_wallet['balance']})")
                    return True
                else:
                    self.log_test("Default Wallet Creation", False, 
                                f"Unexpected wallet name: {default_wallet.get('name')}")
            else:
                self.log_test("Default Wallet Creation", False, 
                            "No wallets found after registration")
        else:
            self.log_test("Default Wallet Creation", False, 
                        f"Failed to get wallets: {response.status_code} - {response.text}")
        return False

    def test_create_wallet(self):
        """Test wallet creation"""
        wallet_data = {
            "name": "Portfel Wakacyjny",
            "emoji": "🏖️",
            "is_shared": False
        }
        
        response = self.make_request("POST", "/wallets", wallet_data)
        
        if response.status_code == 200:
            wallet = response.json()
            self.created_resources['wallets'].append(wallet['id'])
            
            expected_fields = ["id", "name", "emoji", "balance", "is_shared", "owner_id", "created_at"]
            if all(field in wallet for field in expected_fields):
                self.log_test("Create Wallet", True, 
                            f"Wallet created: {wallet['name']} {wallet['emoji']} (ID: {wallet['id']})")
                return wallet
            else:
                self.log_test("Create Wallet", False, 
                            f"Missing wallet fields: {response.text}")
        else:
            self.log_test("Create Wallet", False, 
                        f"Wallet creation failed: {response.status_code} - {response.text}")
        return None

    def test_get_wallets(self):
        """Test getting user's wallets"""
        response = self.make_request("GET", "/wallets")
        
        if response.status_code == 200:
            wallets = response.json()
            if isinstance(wallets, list):
                self.log_test("Get Wallets", True, 
                            f"Retrieved {len(wallets)} wallets")
                return wallets
            else:
                self.log_test("Get Wallets", False, 
                            f"Expected list, got: {type(wallets)}")
        else:
            self.log_test("Get Wallets", False, 
                        f"Get wallets failed: {response.status_code} - {response.text}")
        return []

    def test_delete_wallet(self, wallet_id: str):
        """Test wallet deletion"""
        response = self.make_request("DELETE", f"/wallets/{wallet_id}")
        
        if response.status_code == 200:
            self.log_test("Delete Wallet", True, 
                        f"Wallet {wallet_id} deleted successfully")
            return True
        else:
            self.log_test("Delete Wallet", False, 
                        f"Wallet deletion failed: {response.status_code} - {response.text}")
        return False

    # ================== TRANSACTION TESTS ==================
    
    def test_create_income_transaction(self, wallet_id: str):
        """Test creating an income transaction"""
        transaction_data = {
            "wallet_id": wallet_id,
            "amount": 2500.0,
            "type": "income",
            "category": "Pensja",
            "emoji": "💰",
            "note": "Wypłata za styczeń"
        }
        
        response = self.make_request("POST", "/transactions", transaction_data)
        
        if response.status_code == 200:
            transaction = response.json()
            self.created_resources['transactions'].append(transaction['id'])
            
            expected_fields = ["id", "wallet_id", "user_id", "amount", "type", "category", "emoji", "created_at"]
            if all(field in transaction for field in expected_fields):
                self.log_test("Create Income Transaction", True, 
                            f"Income transaction created: +{transaction['amount']} PLN ({transaction['category']})")
                return transaction
            else:
                self.log_test("Create Income Transaction", False, 
                            f"Missing transaction fields: {response.text}")
        else:
            self.log_test("Create Income Transaction", False, 
                        f"Transaction creation failed: {response.status_code} - {response.text}")
        return None

    def test_create_expense_transaction(self, wallet_id: str):
        """Test creating an expense transaction"""
        transaction_data = {
            "wallet_id": wallet_id,
            "amount": 350.0,
            "type": "expense",
            "category": "Zakupy spożywcze",
            "emoji": "🛒",
            "note": "Zakupy w Biedronce"
        }
        
        response = self.make_request("POST", "/transactions", transaction_data)
        
        if response.status_code == 200:
            transaction = response.json()
            self.created_resources['transactions'].append(transaction['id'])
            
            self.log_test("Create Expense Transaction", True, 
                        f"Expense transaction created: -{transaction['amount']} PLN ({transaction['category']})")
            return transaction
        else:
            self.log_test("Create Expense Transaction", False, 
                        f"Transaction creation failed: {response.status_code} - {response.text}")
        return None

    def test_get_transactions(self):
        """Test getting user's transactions"""
        response = self.make_request("GET", "/transactions")
        
        if response.status_code == 200:
            transactions = response.json()
            if isinstance(transactions, list):
                self.log_test("Get Transactions", True, 
                            f"Retrieved {len(transactions)} transactions")
                return transactions
            else:
                self.log_test("Get Transactions", False, 
                            f"Expected list, got: {type(transactions)}")
        else:
            self.log_test("Get Transactions", False, 
                        f"Get transactions failed: {response.status_code} - {response.text}")
        return []

    def test_wallet_balance_update(self, wallet_id: str, expected_balance: float):
        """Test that wallet balance is updated after transactions"""
        response = self.make_request("GET", f"/wallets/{wallet_id}")
        
        if response.status_code == 200:
            wallet = response.json()
            actual_balance = wallet.get("balance", 0)
            
            if abs(actual_balance - expected_balance) < 0.01:  # Allow for floating point precision
                self.log_test("Wallet Balance Update", True, 
                            f"Wallet balance correctly updated to {actual_balance} PLN")
                return True
            else:
                self.log_test("Wallet Balance Update", False, 
                            f"Balance mismatch. Expected: {expected_balance}, Actual: {actual_balance}")
        else:
            self.log_test("Wallet Balance Update", False, 
                        f"Failed to get wallet: {response.status_code} - {response.text}")
        return False

    def test_delete_transaction(self, transaction_id: str):
        """Test transaction deletion"""
        response = self.make_request("DELETE", f"/transactions/{transaction_id}")
        
        if response.status_code == 200:
            self.log_test("Delete Transaction", True, 
                        f"Transaction {transaction_id} deleted successfully")
            return True
        else:
            self.log_test("Delete Transaction", False, 
                        f"Transaction deletion failed: {response.status_code} - {response.text}")
        return False

    # ================== GOAL TESTS ==================
    
    def test_create_goal(self):
        """Test goal creation"""
        goal_data = {
            "name": "Wakacje w Hiszpanii",
            "target_amount": 5000.0,
            "emoji": "🇪🇸"
        }
        
        response = self.make_request("POST", "/goals", goal_data)
        
        if response.status_code == 200:
            goal = response.json()
            self.created_resources['goals'].append(goal['id'])
            
            expected_fields = ["id", "user_id", "name", "target_amount", "current_amount", "emoji", "completed", "created_at"]
            if all(field in goal for field in expected_fields):
                self.log_test("Create Goal", True, 
                            f"Goal created: {goal['name']} {goal['emoji']} (Target: {goal['target_amount']} PLN)")
                return goal
            else:
                self.log_test("Create Goal", False, 
                            f"Missing goal fields: {response.text}")
        else:
            self.log_test("Create Goal", False, 
                        f"Goal creation failed: {response.status_code} - {response.text}")
        return None

    def test_get_goals(self):
        """Test getting user's goals"""
        response = self.make_request("GET", "/goals")
        
        if response.status_code == 200:
            goals = response.json()
            if isinstance(goals, list):
                self.log_test("Get Goals", True, 
                            f"Retrieved {len(goals)} goals")
                return goals
            else:
                self.log_test("Get Goals", False, 
                            f"Expected list, got: {type(goals)}")
        else:
            self.log_test("Get Goals", False, 
                        f"Get goals failed: {response.status_code} - {response.text}")
        return []

    def test_contribute_to_goal(self, goal_id: str):
        """Test contributing to a goal"""
        contribution_data = {
            "amount": 1000.0
        }
        
        response = self.make_request("POST", f"/goals/{goal_id}/contribute", contribution_data)
        
        if response.status_code == 200:
            goal = response.json()
            self.log_test("Contribute to Goal", True, 
                        f"Contributed 1000 PLN to goal. Current: {goal['current_amount']}/{goal['target_amount']} PLN")
            return goal
        else:
            self.log_test("Contribute to Goal", False, 
                        f"Goal contribution failed: {response.status_code} - {response.text}")
        return None

    def test_delete_goal(self, goal_id: str):
        """Test goal deletion"""
        response = self.make_request("DELETE", f"/goals/{goal_id}")
        
        if response.status_code == 200:
            self.log_test("Delete Goal", True, 
                        f"Goal {goal_id} deleted successfully")
            return True
        else:
            self.log_test("Delete Goal", False, 
                        f"Goal deletion failed: {response.status_code} - {response.text}")
        return False

    # ================== DASHBOARD TESTS ==================
    
    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        response = self.make_request("GET", "/dashboard/stats")
        
        if response.status_code == 200:
            stats = response.json()
            expected_fields = ["total_balance", "month_income", "month_expenses", "wallets_count", "goals_progress"]
            
            if all(field in stats for field in expected_fields):
                self.log_test("Dashboard Stats", True, 
                            f"Dashboard stats retrieved: Balance={stats['total_balance']} PLN, "
                            f"Income={stats['month_income']} PLN, Expenses={stats['month_expenses']} PLN")
                return stats
            else:
                self.log_test("Dashboard Stats", False, 
                            f"Missing stats fields: {response.text}")
        else:
            self.log_test("Dashboard Stats", False, 
                        f"Dashboard stats failed: {response.status_code} - {response.text}")
        return None

    # ================== AI CHAT TESTS ==================
    
    def test_ai_chat(self):
        """Test AI chat functionality"""
        chat_data = {
            "message": "Jak mogę lepiej zarządzać moim budżetem domowym?"
        }
        
        response = self.make_request("POST", "/ai/chat", chat_data)
        
        if response.status_code == 200:
            chat_response = response.json()
            expected_fields = ["response", "timestamp"]
            
            if all(field in chat_response for field in expected_fields):
                response_text = chat_response["response"]
                # Check if response is in Polish (contains Polish characters or phrases)
                polish_indicators = ["może", "można", "budżet", "oszczędzanie", "finanse", "ą", "ę", "ś", "ć", "ź", "ż", "ł"]
                is_polish = any(indicator in response_text.lower() for indicator in polish_indicators)
                
                if is_polish and len(response_text) > 50:
                    self.log_test("AI Chat", True, 
                                f"AI responded in Polish with financial advice (length: {len(response_text)} chars)")
                    return chat_response
                else:
                    self.log_test("AI Chat", False, 
                                f"AI response seems incomplete or not in Polish: {response_text[:100]}...")
            else:
                self.log_test("AI Chat", False, 
                            f"Missing chat response fields: {response.text}")
        else:
            self.log_test("AI Chat", False, 
                        f"AI chat failed: {response.status_code} - {response.text}")
        return None

    def test_ai_chat_history(self):
        """Test AI chat history"""
        response = self.make_request("GET", "/ai/history")
        
        if response.status_code == 200:
            history = response.json()
            if isinstance(history, list):
                self.log_test("AI Chat History", True, 
                            f"Retrieved {len(history)} chat messages")
                return history
            else:
                self.log_test("AI Chat History", False, 
                            f"Expected list, got: {type(history)}")
        else:
            self.log_test("AI Chat History", False, 
                        f"Chat history failed: {response.status_code} - {response.text}")
        return []

    # ================== ERROR TESTS ==================
    
    def test_unauthorized_access(self):
        """Test that endpoints require authentication"""
        # Temporarily remove auth token
        original_token = self.auth_token
        self.auth_token = None
        
        response = self.make_request("GET", "/wallets", auth=False)
        
        # Restore token
        self.auth_token = original_token
        
        if response.status_code == 401:
            self.log_test("Unauthorized Access Protection", True, 
                        "Protected endpoint correctly rejects unauthenticated requests")
            return True
        else:
            self.log_test("Unauthorized Access Protection", False, 
                        f"Expected 401, got: {response.status_code}")
        return False

    def test_invalid_transaction_type(self, wallet_id: str):
        """Test invalid transaction type validation"""
        transaction_data = {
            "wallet_id": wallet_id,
            "amount": 100.0,
            "type": "invalid_type",
            "category": "Test",
            "emoji": "💰"
        }
        
        response = self.make_request("POST", "/transactions", transaction_data)
        
        if response.status_code == 400:
            self.log_test("Invalid Transaction Type Validation", True, 
                        "Invalid transaction type correctly rejected")
            return True
        else:
            self.log_test("Invalid Transaction Type Validation", False, 
                        f"Expected 400, got: {response.status_code} - {response.text}")
        return False

    # ================== MAIN TEST RUNNER ==================
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print(f"🔧 Starting comprehensive backend API tests for Cenny Grosz")
        print(f"📡 Backend URL: {BASE_URL}")
        print(f"👤 Test user: {self.test_user['email']}")
        print("=" * 80)
        
        # Health check
        self.test_health_check()
        
        # Authentication tests
        if not self.test_user_registration():
            if not self.test_user_login():
                print("❌ Cannot proceed without authentication")
                return False
        else:
            # If registration was successful, we already have the token
            pass
            
        if not self.auth_token:
            # Try login if we don't have token yet
            if not self.test_user_login():
                print("❌ Authentication failed, cannot proceed")
                return False
        
        self.test_get_current_user()
        
        # Wallet tests
        self.test_get_default_wallet()
        created_wallet = self.test_create_wallet()
        wallets = self.test_get_wallets()
        
        # Use the first available wallet for transaction tests
        test_wallet_id = None
        if wallets and len(wallets) > 0:
            test_wallet_id = wallets[0]['id']
        
        if test_wallet_id:
            # Transaction tests
            initial_balance = wallets[0]['balance']
            income_tx = self.test_create_income_transaction(test_wallet_id)
            expense_tx = self.test_create_expense_transaction(test_wallet_id)
            
            # Check balance update (initial + 2500 - 350)
            expected_balance = initial_balance + 2500.0 - 350.0
            self.test_wallet_balance_update(test_wallet_id, expected_balance)
            
            self.test_get_transactions()
            
            # Test invalid transaction type
            self.test_invalid_transaction_type(test_wallet_id)
        
        # Goal tests
        created_goal = self.test_create_goal()
        self.test_get_goals()
        
        if created_goal:
            self.test_contribute_to_goal(created_goal['id'])
        
        # Dashboard tests
        self.test_dashboard_stats()
        
        # AI tests
        self.test_ai_chat()
        self.test_ai_chat_history()
        
        # Security tests
        self.test_unauthorized_access()
        
        # Cleanup - delete created resources (optional)
        # Note: We could delete created resources here, but for testing purposes
        # we'll leave them to verify data persistence
        
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        return failed_tests == 0

def main():
    """Main test execution"""
    print("🚀 Cenny Grosz Backend API Test Suite")
    print("=" * 50)
    
    runner = TestRunner()
    success = runner.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend APIs are working correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())