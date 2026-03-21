# Task: Fix Next.js API proxy for /api/videos/results/:id ✓

## Plan Implementation Steps
- [x] Create this TODO.md for tracking
- [x] Replace mock data in app/api/videos/results/[id]/route.ts with backend proxy (forward Auth header, exact response) ✓
- [ ] Test: Run Flask (`python api/app.py`), Next.js (`pnpm dev`), call endpoint from UI, check network tab for full structure
- [ ] (Optional) Uncomment/fix Flask handler in api/routes_video.py @get_result to return full metrics/DB data
- [x] Frontend proxy complete ✓

**Why previous response missing "metrics"**: Frontend used TEMP MOCK without full structure. New proxy forwards **exact** backend response (currently empty until backend uncommented).

