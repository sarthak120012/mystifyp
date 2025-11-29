# 🚀 Deployment Guide: GitHub & Vercel

Follow these steps to put your code on GitHub and deploy it to the internet using Vercel.

## Part 1: Put your code on GitHub

1.  **Initialize Git**
    *   Run this command in your terminal:
        ```bash
        git init
        ```

2.  **Commit your files**
    *   Run the following commands:
        ```bash
        git add .
        git commit -m "Initial commit - Mystify App"
        ```

3.  **Create a Repository on GitHub**
    *   Go to [github.com/new](https://github.com/new).
    *   Name your repository (e.g., `mystify-app`).
    *   Make it **Public** or **Private**.
    *   **Do not** check "Initialize with README" or .gitignore.
    *   Click **Create repository**.

4.  **Connect and Push**
    *   Copy the commands under "…or push an existing repository from the command line". They look like this:
        ```bash
        git remote add origin https://github.com/YOUR_USERNAME/mystify-app.git
        git branch -M main
        git push -u origin main
        ```
    *   Paste and run them in your terminal.

---

## Part 2: Deploy to Vercel

1.  **Sign up/Login to Vercel**
    *   Go to [vercel.com](https://vercel.com).
    *   Login with **GitHub**.

2.  **Import Project**
    *   Click **"Add New..."** -> **"Project"**.
    *   You should see your `mystify-app` repository in the list. Click **Import**.

3.  **Configure Project**
    *   **Framework Preset**: It should auto-detect `Vite`.
    *   **Root Directory**: `./` (default).
    *   **Environment Variables**:
        *   You need to add your Supabase keys here so the live site can talk to the database.
        *   Copy them from your `.env` file.
        *   Add:
            *   `VITE_SUPABASE_URL`
            *   `VITE_SUPABASE_ANON_KEY`

4.  **Deploy**
    *   Click **Deploy**.
    *   Wait a minute, and your site will be live! 🚀

---

## 💡 Important Note on Environment Variables
Your `.env` file is **not** uploaded to GitHub for security. You **MUST** add the environment variables in the Vercel dashboard (Step 3 above) for the app to work.
