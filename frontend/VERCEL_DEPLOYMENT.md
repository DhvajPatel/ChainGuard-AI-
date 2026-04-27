# 🚀 Vercel Deployment Guide for ChainGuard AI Frontend

## ⚠️ Important: Backend Must Be Deployed First!

Your frontend needs a backend to work. You have 2 options:

---

## Option 1: Deploy Backend to Hugging Face Spaces (Recommended)

### Step 1: Deploy Backend

1. Go to https://huggingface.co/spaces
2. Click "Create new Space"
3. Settings:
   - Name: `chainguard-ai-backend`
   - SDK: **Docker** (IMPORTANT!)
   - License: MIT
4. Upload these files from `backend/` folder:
   ```
   ✅ README.md
   ✅ Dockerfile
   ✅ main.py
   ✅ requirements.txt
   ✅ routers/ (all files)
   ✅ data/sample_shipments.json
   ```
5. Wait 2-3 minutes for build
6. Test: Visit `https://YOUR-USERNAME-chainguard-ai-backend.hf.space/`

### Step 2: Configure Frontend Environment Variable

**Option A: Using Vercel Dashboard (Easiest)**

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project: `chain-guard-ai-kappa`
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   ```
   Name: VITE_API_URL
   Value: https://YOUR-USERNAME-chainguard-ai-backend.hf.space/api
   ```
5. Click **Save**
6. Go to **Deployments** tab
7. Click **Redeploy** on latest deployment

**Option B: Using .env.production File**

1. Edit `frontend/.env.production`:
   ```env
   VITE_API_URL=https://YOUR-USERNAME-chainguard-ai-backend.hf.space/api
   ```

2. Commit and push:
   ```bash
   git add frontend/.env.production
   git commit -m "Add production backend URL"
   git push
   ```

3. Vercel will automatically redeploy

### Step 3: Verify Deployment

Visit: https://chain-guard-ai-kappa.vercel.app/

1. Click "Dashboard" tab
2. Click "Use Sample Data"
3. Should load 10 shipments ✅
4. Click "AI Predict" tab
5. Fill form and click "Generate AI Prediction"
6. Should show prediction results ✅

---

## Option 2: Use Mock Data (No Backend Required)

If you don't want to deploy a backend, the frontend already has mock data fallback.

### Current Behavior:

- **"Use Sample Data"** button → Uses mock data (works without backend)
- **"AI Predict"** button → Requires backend (won't work without it)

### To Make Predictions Work Without Backend:

You would need to implement client-side prediction logic in the frontend. This is not recommended as the AI logic should be on the backend.

---

## 🔧 Current Issue Explanation

Your deployed site at https://chain-guard-ai-kappa.vercel.app/ is trying to connect to:
```
http://localhost:8000/api
```

This doesn't work because:
- ❌ `localhost` only works on your local machine
- ❌ Vercel's servers can't access your local computer
- ❌ Users visiting your site can't access localhost

**Solution**: Deploy backend to Hugging Face and update the API URL.

---

## 📊 Architecture

```
┌─────────────────────┐
│   Vercel            │
│   (Frontend)        │
│   chain-guard-ai    │
└──────────┬──────────┘
           │
           │ HTTPS API Calls
           │
┌──────────▼──────────┐
│   Hugging Face      │
│   (Backend)         │
│   Docker Space      │
└─────────────────────┘
```

---

## 🧪 Testing After Deployment

### Test Backend First

```bash
# Test root
curl https://YOUR-USERNAME-chainguard-ai-backend.hf.space/

# Expected: {"message": "ChainGuard AI — Predict Delays Before They Happen", "status": "online"}

# Test prediction
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

### Test Frontend

1. Visit: https://chain-guard-ai-kappa.vercel.app/
2. Open browser console (F12)
3. Click "Use Sample Data"
4. Check console for API calls
5. Should see successful requests to your backend

---

## 🐛 Troubleshooting

### Issue: "Failed to get prediction"

**Cause**: Backend not deployed or wrong URL

**Solution**:
1. Verify backend is running: Visit backend URL in browser
2. Check environment variable in Vercel dashboard
3. Ensure URL ends with `/api` (not `/api/`)
4. Check browser console for CORS errors

### Issue: CORS errors in browser console

**Cause**: Backend not allowing requests from Vercel domain

**Solution**: Update `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://chain-guard-ai-kappa.vercel.app",
        "*"  # Allow all (for testing)
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then redeploy backend to Hugging Face.

### Issue: Environment variable not working

**Cause**: Vercel needs rebuild after adding env vars

**Solution**:
1. Go to Vercel dashboard
2. Deployments tab
3. Click "Redeploy" on latest deployment
4. Select "Use existing Build Cache" = NO

---

## 📝 Quick Commands

### Local Development
```bash
# Backend (terminal 1)
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (terminal 2)
cd frontend
npm run dev
```

### Build for Production
```bash
cd frontend
npm run build
```

### Deploy to Vercel (CLI)
```bash
cd frontend
vercel --prod
```

---

## ✅ Deployment Checklist

### Backend Deployment
- [ ] Hugging Face Space created (Docker SDK)
- [ ] All backend files uploaded
- [ ] Space shows "Running" status
- [ ] Root endpoint returns status message
- [ ] Prediction endpoint tested and working

### Frontend Configuration
- [ ] Environment variable added in Vercel
- [ ] Backend URL is correct (ends with `/api`)
- [ ] Frontend redeployed after adding env var
- [ ] No CORS errors in browser console

### Testing
- [ ] "Use Sample Data" loads shipments
- [ ] "Generate AI Prediction" returns results
- [ ] All charts and metrics display
- [ ] No errors in browser console
- [ ] Mobile responsive works

---

## 🎯 Next Steps

1. **Deploy Backend** to Hugging Face Spaces (5 min)
2. **Add Environment Variable** in Vercel dashboard (1 min)
3. **Redeploy Frontend** in Vercel (1 min)
4. **Test Everything** (2 min)

**Total Time: ~10 minutes**

---

## 📞 Need Help?

### Resources
- 📖 Backend Deployment: `backend/HUGGINGFACE_DEPLOYMENT.md`
- 📖 Quick Start: `QUICK_START.md`
- 🧪 Test Backend: `python backend/test_api.py`

### Your Current URLs
- Frontend: https://chain-guard-ai-kappa.vercel.app/
- Backend: (needs to be deployed)

---

**Good luck with deployment! 🚀**
