# Deployment Guide

Since **M3U Maker** is a client-side application (Single Page Application) that runs entirely in the browser, you can host it for **free** on many static site hosting providers.

**Important Note on Data:**
This application uses your browser's **IndexedDB** to store tracks and playlists.
*   **Data is Local:** Your tracks and playlists are stored **only on your specific device and browser**.
*   **No Cloud Sync:** If you open the app on a different computer (or your friend opens it on theirs), it will start empty. You cannot "see" each other's tracks automatically.
*   **Sharing:** To share a playlist, you must use the **"Download M3U"** or **"Download Files"** buttons and send the files to your friend.

---

## Option 1: Cloudflare Pages (Recommended)

1.  **Push your code to GitHub**:
    *   Make sure this project is in a GitHub repository.
2.  **Log in to Cloudflare**:
    *   Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3.  **Create a Project**:
    *   Go to **Compute (Workers & Pages)** > **Pages**.
    *   Click **Connect to Git**.
    *   Select your repository.
4.  **Configure Build**:
    *   **Framework Preset**: Select `Vite` (or `React`).
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  **Deploy**:
    *   Click **Save and Deploy**.

## Option 2: Vercel

1.  Go to [Vercel.com](https://vercel.com) and sign up/login.
2.  Click **Add New...** > **Project**.
3.  Import your GitHub repository.
4.  Vercel usually detects Vite automatically.
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  Click **Deploy**.

## Option 3: Netlify

1.  Go to [Netlify.com](https://netlify.com).
2.  Click **Add new site** > **Import from an existing project**.
3.  Connect to GitHub and choose your repo.
4.  **Build Command**: `npm run build`
5.  **Publish directory**: `dist`
6.  Click **Deploy site**.

## Manual Build (Run Locally)

If you just want to run it on your machine without the dev server:

1.  Run the build command:
    ```bash
    npm run build
    ```
2.  Preview the production build:
    ```bash
    npm run preview
    ```
