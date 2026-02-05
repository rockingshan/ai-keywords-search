# Keyword Search Jobs - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Ensure Server is Running

```bash
# In the project root directory
npm start
```

You should see:
```
🚀 ASO Keyword API running on port 3000
✅ Job Runner service initialized
```

### Step 2: Start Frontend

```bash
# In a new terminal
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Step 3: Navigate to Jobs Page

Open your browser and go to:
```
http://localhost:5173/keywordsearch/jobs
```

### Step 4: Create Your First Job

1. Click **"New Job"** button
2. Fill in the form:
   - **Name**: "My First Discovery"
   - **Strategy**: Random (for diverse results)
   - **Searches per Batch**: 1
   - **Interval**: 1 minute (for quick testing, use 15+ in production)
   - **Total Cycles**: 5
   - **Country**: United States
3. Click **"Create Job"**

### Step 5: Start the Job

- Find your job in the list
- Click the **Play** button (▶️)
- Watch it change to "Running" status

### Step 6: Monitor Progress

The job will:
- Run for ~5 minutes (5 cycles × 1 minute)
- Search 5 random keywords
- Update progress in real-time

You'll see:
- Current cycle counter increasing
- Keywords count growing
- Progress bar filling up

### Step 7: View Results

1. Wait for job to complete (or click while running)
2. Click the **Chart** icon (📈) next to your job
3. See all searched keywords with:
   - Popularity score
   - Difficulty score
   - Opportunity score (higher is better!)
   - Competitor count

### Step 8: Track Promising Keywords

1. In the results modal:
   - Check the boxes next to keywords with high opportunity scores (>5.0)
   - Click **"Add to Tracked"** button
2. Navigate to `/tracking` to see your saved keywords

## 🎯 What to Look For

### Good Keywords Have:
- ✅ Popularity > 30 (enough search volume)
- ✅ Difficulty < 50 (not too competitive)
- ✅ Opportunity Score > 5.0 (best ratio)
- ✅ Related to actual app ideas

### Example Good Result:
```
Keyword: "home workout timer"
Popularity: 45
Difficulty: 35
Opportunity: 6.4
```

### Example Poor Result:
```
Keyword: "fitness"
Popularity: 85
Difficulty: 95
Opportunity: 0.9
```

## 🧪 Test with Script

For automated testing:

```bash
node test-jobs.js
```

This script will:
1. Create a test job
2. Start it automatically
3. Monitor progress
4. Show top results
5. Track best keywords

## ⚙️ Recommended Settings

### For Testing (Quick Results)
```
Searches per Batch: 2
Interval: 1 minute
Total Cycles: 3
Strategy: Random
```
**Result**: 6 keywords in ~3 minutes

### For Daily Discovery (Safe)
```
Searches per Batch: 1
Interval: 15 minutes
Total Cycles: 50
Strategy: Random
```
**Result**: 50 keywords in ~12.5 hours

### For Niche Deep Dive
```
Searches per Batch: 1
Interval: 10 minutes
Total Cycles: 30
Strategy: Category
Seed Category: "Health & Fitness"
```
**Result**: 30 fitness-related keywords in ~5 hours

### For Overnight Run
```
Searches per Batch: 1
Interval: 5 minutes
Total Cycles: 100
Strategy: Trending
```
**Result**: 100 trending keywords in ~8 hours

## 📊 Understanding Results

### Popularity (5-100)
- **5-20**: Very low search volume
- **20-40**: Low-medium search volume
- **40-60**: Medium search volume
- **60-80**: High search volume
- **80-100**: Very high search volume

### Difficulty (0-100)
- **0-30**: Easy to compete
- **30-50**: Moderate competition
- **50-70**: High competition
- **70-100**: Very hard to compete

### Opportunity Score
Formula: `(Popularity / Difficulty) × 10`

- **< 2.0**: Poor opportunity
- **2.0-4.0**: Fair opportunity
- **4.0-6.0**: Good opportunity
- **> 6.0**: Excellent opportunity

### Best Opportunities
Look for keywords with:
1. High popularity (40+)
2. Low-medium difficulty (< 50)
3. Opportunity score > 5.0

## 🎨 UI Guide

### Job Status Colors
- 🟡 **Yellow (Pending)**: Job created but not started
- 🟢 **Green (Running)**: Job is actively searching
- 🟠 **Orange (Paused)**: Job was stopped
- 🔵 **Blue (Completed)**: Job finished all cycles
- 🔴 **Red (Failed)**: Job encountered error

### Buttons
- ▶️ **Play**: Start a pending/paused job
- ⏹️ **Stop**: Pause a running job
- 📈 **Chart**: View job results
- 🗑️ **Trash**: Delete job (removes all results)

## 🔄 Job Lifecycle

```
Created → Start → Running → [Cycles] → Completed
   ↓                 ↓
Pending           Paused (if stopped)
```

## 💡 Pro Tips

### 1. Start Small
- Test with 3-5 cycles first
- Verify keyword quality
- Adjust strategy if needed

### 2. Monitor First Job
- Watch the first few results
- Ensure keywords make sense
- Check opportunity scores

### 3. Use Longer Intervals
- Safer for API rate limits
- More sustainable long-term
- 10-15 minutes recommended

### 4. Try Different Strategies
- **Random**: Best for discovery
- **Category**: Best for niche focus
- **Trending**: Best for popular markets

### 5. Track Selectively
- Only track high opportunity keywords
- Review before tracking
- Keep list manageable

### 6. Review Regularly
- Check completed jobs daily
- Track best opportunities
- Delete old jobs to clean up

## ⚠️ Troubleshooting

### Job Not Starting
```
Solution: Check server logs for errors
Check: Gemini API key is set in .env
```

### No Results Showing
```
Solution: Wait for first cycle to complete
Check: Job status is "running"
Check: Look for errors in browser console
```

### Poor Quality Keywords
```
Solution: Try different strategy
Try: Increase searches per batch
Try: Use "category" strategy with specific niche
```

### Rate Limit Errors
```
Solution: Increase interval to 15+ minutes
Solution: Reduce searches per batch to 1
Solution: Check external API quotas
```

### Server Restarts
```
Note: Jobs automatically resume
Check: Job status after restart
Action: Monitor first post-restart cycle
```

## 📚 Next Steps

1. ✅ Create your first test job (3-5 cycles)
2. ✅ Review results and track best keywords
3. ✅ Create a longer job for overnight discovery
4. ✅ Try all three strategies
5. ✅ Build up a collection of tracked keywords
6. ✅ Use tracked keywords for app ideation
7. ✅ Research competitors for best opportunities

## 🎓 Learn More

- **Full Documentation**: See `JOBS_FEATURE_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **API Reference**: See `http://localhost:3000/api/docs`

## 🆘 Need Help?

- Check server logs in terminal
- Check browser console (F12)
- Review error messages in UI
- Verify API keys in `.env`
- Try the test script: `node test-jobs.js`

---

**Happy Keyword Hunting! 🎯**
