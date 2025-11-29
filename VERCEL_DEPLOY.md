# Mystify App - Vercel Deployment Instructions

## IMPORTANT: Vercel Configuration

When deploying to Vercel, you MUST configure these settings:

### Build & Development Settings

1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

- `VITE_SUPABASE_URL` = Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

## If You Get "vite: command not found" Error

This means Vercel is not using the correct build command. Go to:
- Project Settings → Build & Development Settings
- Override the Build Command to: `npm run build`

## Deployment Steps

1. Push code to GitHub
2. Import project in Vercel
3. Select **Vite** as Framework Preset
4. Add environment variables
5. Deploy!
