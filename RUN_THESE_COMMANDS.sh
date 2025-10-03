#!/bin/bash

echo "🚀 Unified Mail - GitHub Push Script"
echo "===================================="
echo ""
echo "⚠️  BEFORE RUNNING THIS SCRIPT:"
echo "1. Create a new repository on GitHub: https://github.com/new"
echo "2. Name it: unified-mail"
echo "3. Do NOT initialize with README"
echo "4. Copy the repository URL"
echo ""
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/unified-mail.git): " REPO_URL
echo ""

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Repository URL is required"
    exit 1
fi

echo "📦 Adding remote repository..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub"
    echo ""
    echo "🎉 Next steps:"
    echo "1. View your repo at: ${REPO_URL%.git}"
    echo "2. Follow GMAIL_OAUTH_SETUP.md to enable Gmail integration"
    echo "3. Deploy to Vercel: https://vercel.com"
    echo ""
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "- Check if the repository URL is correct"
    echo "- Make sure you have permission to push to this repository"
    echo "- Try: git push -u origin main --force (if needed)"
    echo ""
fi
