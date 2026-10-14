#!/data/data/com.termux/files/usr/bin/bash
#!/bin/bash

echo ""
echo -e "\e[32mStarting BennyBoy... \e[0m"
echo ""

vercel --prod

echo ""

rm -rf .git
git config --global --add safe.directory /storage/emulated/0/Lapi/HTML/BennyBoy10
git init
git branch -M main
git remote add origin https://github.com/BennyBoy10/BennyBoy10.git
git add .
git commit -m "Updated Files"
git push origin main --force

echo ""
echo -e "\e[32mUpdated BennyBoy! Deleting Git...\e[0m"
echo ""

rm -rf .git

echo ""
echo -e "\e[32mDone!! \e[0m"
echo ""
