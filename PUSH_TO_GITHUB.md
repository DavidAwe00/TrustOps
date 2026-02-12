# Push TrustOps to GitHub

The GitHub CLI authentication had network issues. Here's how to push manually:

## Option 1: Via GitHub Website + Git (Easiest)

### Step 1: Create the repo on GitHub
1. Go to https://github.com/new
2. Repository name: **TrustOps** (or whatever you prefer)
3. Keep it **Private** (recommended - contains sensitive code)
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **Create repository**

### Step 2: Push your code
GitHub will show you commands. Use these:

```bash
cd /Users/davidawe/Desktop/TrustOps

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/TrustOps.git

# Push
git push -u origin main
```

You'll be prompted for your GitHub username and password. For the password, use a **Personal Access Token** (not your actual password):
- Go to https://github.com/settings/tokens/new
- Generate a token with `repo` scope
- Copy and paste it as the password

---

## Option 2: Using SSH (If you have SSH keys set up)

```bash
cd /Users/davidawe/Desktop/TrustOps

# Add remote with SSH
git remote add origin git@github.com:YOUR_USERNAME/TrustOps.git

# Push
git push -u origin main
```

---

## After Pushing

Once pushed, you can deploy to Vercel:
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your TrustOps repository
4. Follow the deployment steps in DEPLOY.md

---

## Quick Commands (Copy-Paste)

```bash
# 1. Create repo on GitHub first, then:
cd /Users/davidawe/Desktop/TrustOps

# 2. Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/TrustOps.git

# 3. Push
git push -u origin main
```
