# 🚀 Hugging Face Spaces Deployment Guide

## ✅ Files Ready for Upload

All files are configured and ready! Here's what you need to upload:

### Required Files (Must Upload)

```
backend/
├── README.md                    ✅ READY (with HF config header)
├── Dockerfile                   ✅ READY (port 7860 configured)
├── main.py                      ✅ READY
├── requirements.txt             ✅ READY
├── routers/
│   ├── __init__.py             ✅ READY
│   ├── predict.py              ✅ READY
│   ├── shipments.py            ✅ READY
│   └── analytics.py            ✅ READY
└── data/
    └── sample_shipments.json    ✅ READY
```

### Files to SKIP (Do Not Upload)

```
❌ ml/ folder (not needed)
❌ *.pkl files (not needed)
❌ __pycache__/ folders
❌ test_api.py (optional)
❌ quick_test.py (optional)
❌ *.md files except README.md
```

---

## 📋 Step-by-Step Deployment

### Step 1: Create Hugging Face Space

1. Go to: https://huggingface.co/spaces
2. Click: **"Create new Space"**
3. Fill in the form:

```
Space name: chainguard-ai-backend
License: MIT
SDK: Docker ⚠️ IMPORTANT - Must select "Docker"!
Visibility: Public (or Private if you prefer)
```

4. Click: **"Create Space"**

### Step 2: Upload Files

You have **3 options** to upload files:

#### Option A: Web Interface (Easiest)

1. Click **"Files"** tab in your Space
2. Click **"Add file"** → **"Upload files"**
3. Drag and drop all files from the list above
4. Click **"Commit changes to main"**

#### Option B: Git (Recommended for developers)

```bash
# Clone your space
git clone https://huggingface.co/spaces/YOUR-USERNAME/chainguard-ai-backend
cd chainguard-ai-backend

# Copy files from backend folder
cp -r ../backend/* .

# Remove unnecessary files
rm -rf ml/ __pycache__/ *.pkl test_api.py quick_test.py

# Commit and push
git add .
git commit -m "Initial deployment"
git push
```

#### Option C: Hugging Face CLI

```bash
# Install Hugging Face CLI
pip install huggingface_hub

# Login
huggingface-cli login

# Upload files
huggingface-cli upload YOUR-USERNAME/chainguard-ai-backend ./backend --repo-type=space
```

### Step 3: Wait for Build

1. Go to your Space page
2. Click **"Logs"** tab
3. Watch the build process (takes 2-3 minutes)

**Expected log output:**
```
Building Docker image...
Installing dependencies...
Starting application...
✅ Container started successfully
```

### Step 4: Test Your Deployment

Once the build completes, your backend will be live at:
```
https://huggingface.co/spaces/YOUR-USERNAME/chainguard-ai-backend
```

**Quick Tests:**

1. **Root Endpoint**
   ```
   https://YOUR-USERNAME-chainguard-ai-backend.hf.space/
   ```
   Expected: `{"message": "ChainGuard AI — Predict Delays Before They Happen", "status": "online"}`

2. **API Documentation**
   ```
   https://YOUR-USERNAME-chainguard-ai-backend.hf.space/docs
   ```
   Expected: Interactive Swagger UI

3. **Sample Shipments**
   ```
   https://YOUR-USERNAME-chainguard-ai-backend.hf.space/api/shipments/
   ```
   Expected: JSON array with 10 shipments

4. **Prediction Endpoint**
   ```bash
   curl -X POST https://YOUR-USERNAME-chainguard-ai-backend.hf.space/api/predict/ \
     -H "Content-Type: application/json" \
     -d '{
       "distance": 500,
       "traffic": "medium",
       "weather": "clear",
       "route_type": "highway",
       "vehicle_type": "truck",
       "historical_delay": 30
     }'
   ```
   Expected: JSON with prediction results

---

## 🔧 Configuration Details

### README.md Header Explained

```yaml
---
title: ChainGuard AI Backend          # Space title
emoji: 🚚                              # Icon shown in Space card
colorFrom: cyan                        # Gradient start color
colorTo: blue                          # Gradient end color
sdk: docker                            # MUST be "docker"
pinned: false                          # Pin to your profile
---
```

### Dockerfile Configuration

```dockerfile
FROM python:3.10                       # Python version
WORKDIR /app                           # Working directory
COPY . .                               # Copy all files
RUN pip install --no-cache-dir -r requirements.txt  # Install deps
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]  # Start server
```

**Important**: Port **7860** is required for Hugging Face Spaces!

---

## 🐛 Troubleshooting

### Issue: "Application startup failed"

**Possible Causes:**
- Wrong SDK selected (must be "Docker")
- Missing Dockerfile
- Syntax error in Dockerfile
- Missing requirements.txt

**Solution:**
1. Check Space settings → SDK should be "Docker"
2. Verify Dockerfile exists in root
3. Check logs for specific error
4. Ensure all required files uploaded

### Issue: "Build failed" or "Container failed to start"

**Possible Causes:**
- Missing dependencies in requirements.txt
- Python version incompatibility
- Port not set to 7860

**Solution:**
1. Check logs for error message
2. Verify requirements.txt has all packages
3. Ensure Dockerfile uses port 7860
4. Try rebuilding: Settings → Factory reboot

### Issue: "404 Not Found" on API endpoints

**Possible Causes:**
- Routers not uploaded
- Missing data/sample_shipments.json
- Wrong endpoint path

**Solution:**
1. Verify all router files uploaded
2. Check data/sample_shipments.json exists
3. Use trailing slash: `/api/predict/` not `/api/predict`
4. Check API docs: `/docs`

### Issue: "CORS errors" from frontend

**Possible Causes:**
- CORS not configured for your frontend domain

**Solution:**
Edit `main.py` and update CORS origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "*"  # Allow all (for testing)
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🎯 Post-Deployment Checklist

After deployment, verify:

- [ ] Space is running (green status)
- [ ] Root endpoint returns status message
- [ ] `/health` endpoint returns healthy
- [ ] `/api/shipments/` returns 10 shipments
- [ ] `/api/predict/` accepts POST and returns prediction
- [ ] `/docs` shows interactive API documentation
- [ ] All 11 endpoints working (test with test_api.py)
- [ ] No errors in logs

---

## 🔄 Update Your Frontend

Once backend is deployed, update your frontend:

### Edit `frontend/src/api/index.ts`:

```typescript
const api = axios.create({ 
  baseURL: "https://YOUR-USERNAME-chainguard-ai-backend.hf.space/api",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});
```

Replace `YOUR-USERNAME` with your actual Hugging Face username.

---

## 📊 Monitoring Your Space

### View Logs
```
Space page → Logs tab
```

### View Metrics
```
Space page → Settings → Analytics
```

### Restart Space
```
Space page → Settings → Factory reboot
```

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Space shows "Running" status  
✅ Root endpoint returns JSON response  
✅ API docs accessible at `/docs`  
✅ All 11 endpoints working  
✅ Sample data loads (10 shipments)  
✅ Prediction endpoint returns valid results  
✅ No errors in logs  
✅ Frontend can connect and make predictions  

---

## 📞 Need Help?

### Resources
- 📖 Hugging Face Docs: https://huggingface.co/docs/hub/spaces
- 📖 Docker Spaces Guide: https://huggingface.co/docs/hub/spaces-sdks-docker
- 🧪 Test Script: `python test_api.py` (update BASE_URL first)

### Common Commands

```bash
# Test deployed backend
curl https://YOUR-USERNAME-chainguard-ai-backend.hf.space/

# Test prediction
curl -X POST https://YOUR-USERNAME-chainguard-ai-backend.hf.space/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{"distance":500,"traffic":"medium","weather":"clear","route_type":"highway","vehicle_type":"truck","historical_delay":30}'

# View API docs
open https://YOUR-USERNAME-chainguard-ai-backend.hf.space/docs
```

---

## 🚀 You're Ready!

All files are configured correctly. Just follow the steps above to deploy!

**Estimated deployment time: 5 minutes**

Good luck! 🎊

---

**Last updated**: April 27, 2026
