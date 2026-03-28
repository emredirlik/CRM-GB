# Test Credentials

## Admin User
- **Username**: admin
- **Password**: 190371
- **Role**: admin
- **Name**: Emre Dirlik

## API Authentication
- Login endpoint: `POST /api/auth/login`
- Request body: `{"username": "admin", "password": "190371"}`
- Response contains: `token` field for Bearer authentication

## Test Usage
```bash
# Get auth token
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"190371"}' | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Use token for authenticated requests
curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/orders"
```
