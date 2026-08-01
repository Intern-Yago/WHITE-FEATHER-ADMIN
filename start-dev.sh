#!/usr/bin/env bash
set -e

echo "===================================================="
echo "  Iniciando White Feather Admin - Modo Sem Docker"
echo "===================================================="

# 1. Backend (Flask + SQLite)
echo ""
echo "[1/3] Verificando ambiente Python (Backend)..."
cd backend
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual venv..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Instalando dependências do Python..."
pip install -q -r requirements.txt

echo "Iniciando Backend na porta 5000..."
python3 src/main.py &
BACKEND_PID=$!
cd ..

# 2. Frontend (React + Vite)
echo ""
echo "[2/3] Verificando dependências do Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Instalando pacotes do Frontend..."
    npx pnpm install || npm install
fi

echo "Iniciando Frontend na porta 5173..."
npx pnpm dev || npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "===================================================="
echo "  Aplicação rodando localmente sem Docker!"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:5000"
echo "===================================================="

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
