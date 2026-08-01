@echo off
chcp 65001 > nul
echo ====================================================
echo   Iniciando White Feather Admin - Modo Sem Docker
echo ====================================================

:: 1. Configurar Backend
echo.
echo [1/3] Verificando ambiente Python (Backend)...
cd backend
if not exist "venv" (
    echo Criando ambiente virtual venv...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo Instalando/Atualizando dependências do Python...
pip install -q -r requirements.txt

echo Iniciando Backend na porta 5000...
start "Backend Flask (Porta 5000)" cmd /k "call venv\Scripts\activate.bat && python src\main.py"
cd ..

:: 2. Configurar Frontend
echo.
echo [2/3] Verificando dependências do Frontend...
cd frontend
if not exist "node_modules" (
    echo Instalando pacotes do Frontend...
    cmd /c npx pnpm install
)

echo Iniciando Frontend Vite na porta 5173...
start "Frontend Vite (Porta 5173)" cmd /k "cmd /c npx pnpm dev"
cd ..

echo.
echo ====================================================
echo   Pronto! Aplicação rodando localmente sem Docker:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:5000
echo ====================================================
pause
