#!/data/data/com.termux/files/usr/bin/bash

# ==============================
# Terminal Colors
# ==============================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[0;37m'
RESET='\033[0m'

# Stop on errors
set -e

echo ""
echo -e "${GREEN}Starting BennyBoy10 backup...${RESET}"
echo ""

# ==============================
# Check Git repository
# ==============================

if [ ! -d ".git" ]; then
  echo -e "${RED}BACKUP FAILED!${RESET}"
  echo -e "${RED}.git was not found.${RESET}"
  echo ""
  exit 1
fi

# ==============================
# Check GitHub
# ==============================

echo -e "${CYAN}Checking GitHub...${RESET}"
git fetch origin

# ==============================
# Add local changes
# ==============================

echo ""
echo -e "${CYAN}Adding local changes...${RESET}"
git add .

# ==============================
# Check for changes
# ==============================

if git diff --cached --quiet; then

  echo ""
  echo -e "${YELLOW}No new local changes.${RESET}"
  echo ""

  echo -e "${CYAN}Checking GitHub status...${RESET}"
  git status

  echo ""
  echo -e "${GREEN}Backup check completed!${RESET}"
  echo ""

  exit 0
fi

# ==============================
# Commit
# ==============================

echo -e "${CYAN}Creating commit...${RESET}"
git commit -m "Updated BennyBoy10"

# ==============================
# Push
# ==============================

echo -e "${CYAN}Uploading to GitHub...${RESET}"
git push origin main

# ==============================
# Done
# ==============================

echo ""
echo -e "${GREEN}BennyBoy10 backup completed successfully!${RESET}"
echo ""





