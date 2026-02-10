#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════
#  SOLbot Deploy Script
#  Deploys directly to any VPS — no GitHub needed
# ═══════════════════════════════════════════════════

BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

banner() {
  echo -e "${CYAN}"
  echo "  ╔═══════════════════════════════════════╗"
  echo "  ║         SOLbot Deploy Script           ║"
  echo "  ╚═══════════════════════════════════════╝"
  echo -e "${RESET}"
}

info()  { echo -e "  ${CYAN}▸${RESET} $1"; }
ok()    { echo -e "  ${GREEN}✓${RESET} $1"; }
warn()  { echo -e "  ${YELLOW}!${RESET} $1"; }
fail()  { echo -e "  ${RED}✗${RESET} $1"; exit 1; }

banner

# ── Mode selection ──
echo -e "${BOLD}Choose deploy mode:${RESET}"
echo "  1) Local (Docker on this machine)"
echo "  2) Remote VPS (scp + ssh)"
echo ""
read -rp "  > " MODE

case $MODE in
  1) DEPLOY_MODE="local" ;;
  2) DEPLOY_MODE="remote" ;;
  *) fail "Invalid option" ;;
esac

# ── Check .env ──
if [ ! -f .env ]; then
  warn ".env file not found"
  echo ""
  read -rp "  Enter your Solana private key (base58): " PRIVATE_KEY
  if [ -z "$PRIVATE_KEY" ]; then
    fail "Private key is required"
  fi

  read -rp "  RPC URL (Enter for default mainnet): " RPC_URL
  RPC_URL=${RPC_URL:-"https://api.mainnet-beta.solana.com"}

  read -rp "  Max SOL per trade (Enter for 0.1): " MAX_SOL
  MAX_SOL=${MAX_SOL:-"0.1"}

  cat > .env <<ENVEOF
SOLANA_PRIVATE_KEY=${PRIVATE_KEY}
SOLANA_RPC_URL=${RPC_URL}
SOLANA_NETWORK=mainnet-beta
SLIPPAGE_BPS=50
MAX_SOL_PER_TRADE=${MAX_SOL}
ENVEOF

  chmod 600 .env
  ok ".env created (permissions: 600 — owner only)"
fi

# ── Local deploy ──
if [ "$DEPLOY_MODE" = "local" ]; then
  info "Building Docker image..."

  if ! command -v docker &> /dev/null; then
    fail "Docker not installed. Install: https://docs.docker.com/get-docker/"
  fi

  docker compose down 2>/dev/null || true
  docker compose up --build -d

  echo ""
  ok "SOLbot is running!"
  echo ""
  info "Dashboard : http://localhost:3000"
  info "API       : http://localhost:3000/api/wallet"
  info "Logs      : docker compose logs -f"
  info "Stop      : docker compose down"
  echo ""
  exit 0
fi

# ── Remote deploy ──
if [ "$DEPLOY_MODE" = "remote" ]; then
  echo ""
  read -rp "  VPS IP or hostname: " VPS_HOST
  read -rp "  SSH user (default: root): " VPS_USER
  VPS_USER=${VPS_USER:-"root"}
  read -rp "  SSH port (default: 22): " VPS_PORT
  VPS_PORT=${VPS_PORT:-"22"}

  SSH_CMD="ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}"
  SCP_CMD="scp -P ${VPS_PORT}"

  info "Testing SSH connection..."
  $SSH_CMD "echo ok" > /dev/null 2>&1 || fail "Cannot connect to ${VPS_USER}@${VPS_HOST}:${VPS_PORT}"
  ok "SSH connection OK"

  REMOTE_DIR="/opt/solbot"

  info "Creating remote directory..."
  $SSH_CMD "mkdir -p ${REMOTE_DIR}/src"

  info "Uploading project files..."
  $SCP_CMD \
    package.json package-lock.json tsconfig.json \
    Dockerfile docker-compose.yml index.html \
    "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"

  $SCP_CMD src/*.ts "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/src/"

  # Upload .env securely (chmod 600)
  $SCP_CMD .env "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/.env"
  $SSH_CMD "chmod 600 ${REMOTE_DIR}/.env"
  ok "Files uploaded (.env secured with 600)"

  info "Building and starting on VPS..."
  $SSH_CMD "cd ${REMOTE_DIR} && docker compose down 2>/dev/null; docker compose up --build -d"

  echo ""
  ok "SOLbot deployed to ${VPS_HOST}!"
  echo ""
  info "Dashboard : http://${VPS_HOST}:3000"
  info "SSH logs  : ${SSH_CMD} 'cd ${REMOTE_DIR} && docker compose logs -f'"
  info "SSH stop  : ${SSH_CMD} 'cd ${REMOTE_DIR} && docker compose down'"
  echo ""
fi
