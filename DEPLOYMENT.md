# GitHub Pages Deployment

This project is a static site, so it can be deployed for free with GitHub Pages.

## 1. Create a GitHub repository

1. Sign in to GitHub.
2. Create a new repository, for example `eee-lab-vault`.
3. Upload these files from this folder:
   - `index.html`
   - `style.css`
   - `script.js`
   - `js/`
   - `backend/`
   - `eee_lab_blog.html`

## 2. Push from your local machine

If you are using Git locally:

```powershell
cd C:\Users\naimi\Downloads\HTML
git init
git branch -M main
git add .
git commit -m "Deploy EEE Lab Vault"
git remote add origin https://github.com/YOUR-USERNAME/eee-lab-vault.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## 3. Turn on GitHub Pages

1. Open the repository on GitHub.
2. Go to `Settings`.
3. Open `Pages`.
4. Under `Build and deployment`:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Save.

After a short wait, GitHub will give you a live URL like:

```text
https://YOUR-USERNAME.github.io/eee-lab-vault/
```

## 4. Update the site later

Whenever you change the code:

```powershell
git add .
git commit -m "Update lab vault"
git push
```

GitHub Pages will redeploy automatically.

## Important security note

This site is deployed as a static frontend. That means:

- Login, reports, drafts, and dashboard data are stored in the browser `localStorage`.
- The security layer added here improves session handling, local access control, throttling, and client-side permissions.
- It is **not** a substitute for a real backend if you need true server-side authentication, private database storage, or multi-device shared accounts.

## If you want stronger production security later

Move the data and authentication to a backend such as:

- Firebase
- Supabase
- Appwrite
- A Node.js API on Render / Railway / Vercel

Then keep GitHub Pages only for the frontend.
