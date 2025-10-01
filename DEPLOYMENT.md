# Deploy Survey Analytics Dashboard to GitHub Pages

## Configuration Summary

✅ **API Backend**: https://accurately-living-phoenix.ngrok-free.app  
✅ **GitHub Pages Path**: `/analytics-dashboard`  
✅ **Static Export**: Enabled  

## Deployment Steps

### 1. Push to GitHub

```bash
cd C:\eZAIX\AIX
git add .
git commit -m "Configure analytics dashboard for GitHub Pages deployment"
git push origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow will automatically trigger on push to `main`

### 3. Access Your Dashboard

After deployment completes (2-3 minutes), access at:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/analytics-dashboard
```

## Local Build Test

Test the static build locally before deploying:

```bash
cd AIX_IQ\apps\Idea_Agent\analytics_frontend
npm run build
```

The static files will be in the `out` directory.

## Environment Variables

The dashboard is configured to use:
- `NEXT_PUBLIC_API_URL`: https://accurately-living-phoenix.ngrok-free.app

This is hardcoded in the build, so if your ngrok URL changes, you need to:
1. Update `next.config.ts`
2. Update all fetch calls in the pages
3. Rebuild and redeploy

## Troubleshooting

**CORS Issues**: Make sure your ngrok backend has CORS enabled for your GitHub Pages domain.

**404 on Refresh**: This is normal for GitHub Pages with basePath. Always navigate from the home page.

**API Not Loading**: Check that your ngrok tunnel is active and the backend is running on port 3978.

