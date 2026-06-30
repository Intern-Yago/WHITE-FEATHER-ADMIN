# Sistema de Gestão

Uma aplicação web completa para gerenciar as atividades de um templo umbandista, incluindo controle financeiro, gestão de materiais religiosos e cadastro de membros.

## 🌟 Funcionalidades

### 📊 Dashboard
- Visão geral do templo com métricas importantes
- Resumo financeiro (receitas, despesas, saldo)
- Informações sobre membros e mensalidades
- Status do estoque de materiais religiosos

### 💰 Módulo Financeiro
- Controle de receitas e despesas
- Categorias específicas para templo umbandista:
  - **Receitas**: Mensalidades, Doações, Eventos, Vendas
  - **Despesas**: Materiais, Manutenção, Utilidades, Alimentação, Outros
- Histórico completo de movimentações
- Relatórios de saldo atual

### 👥 Gestão de Membros
- Cadastro completo de membros do templo
- Controle de mensalidades individuais
- Registro de pagamentos por mês
- Acompanhamento de inadimplência
- Relatórios de receita esperada vs recebida

### 📦 Controle de Materiais
- Gestão de estoque de materiais religiosos
- Controle de entrada, saída e ajustes
- Alertas de estoque baixo
- Histórico de movimentações

## 🚀 Como Executar

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- pnpm

### Backend (Flask)
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python src/main.py
```
O backend estará disponível em: http://localhost:5000

### Frontend (React)
```bash
cd frontend
pnpm install
pnpm run dev
```
O frontend estará disponível em: http://localhost:5173

## 📱 Interface

A aplicação possui uma interface moderna e responsiva com:
- Menu lateral com navegação intuitiva
- Cards informativos no dashboard
- Formulários completos para cadastros
- Tabelas organizadas para listagens
- Modais para ações rápidas
- Design adaptado para desktop e mobile

## 🎨 Tecnologias Utilizadas

### Backend
- **Flask**: Framework web Python
- **SQLite**: Banco de dados
- **Flask-CORS**: Suporte a CORS
- **Python**: Linguagem de programação

### Frontend
- **React**: Biblioteca JavaScript
- **Vite**: Build tool
- **Tailwind CSS**: Framework CSS
- **Shadcn/ui**: Componentes UI
- **Lucide React**: Ícones
- **React Router**: Roteamento

## 📋 Estrutura do Projeto

```
gestao-app/
├── backend/
│   ├── src/
│   │   ├── main.py              # Aplicação principal
│   │   ├── models/              # Modelos de dados
│   │   │   ├── financeiro.py
│   │   │   ├── estoque.py
│   │   │   └── membro.py
│   │   └── routes/              # Rotas da API
│   │       ├── financeiro.py
│   │       ├── estoque.py
│   │       └── membro.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   ├── Layout.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/               # Páginas da aplicação
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Financeiro.jsx
│   │   │   ├── Materiais.jsx
│   │   │   └── Membros.jsx
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🔧 Configuração

### Banco de Dados
O sistema utiliza SQLite e cria automaticamente as tabelas necessárias na primeira execução.

### Categorias Pré-configuradas
O sistema já vem com categorias específicas para templos umbandistas:

**Receitas:**
- Mensalidades
- Doações
- Eventos e Festivais
- Vendas de Materiais

**Despesas:**
- Materiais 
- Manutenção
- Contas (Luz, Água, etc.)
- Alimentação para Eventos
- Outros

**Materiais:**
- Velas (Brancas, Coloridas, Especiais)
- Incensos (Diversos tipos)
- Ervas (Para banhos e defumações)
- Bebidas (Para oferendas)
- Flores (Decoração e oferendas)
- Outros materiais

## 📞 Suporte

Esta aplicação foi desenvolvida especificamente para atender às necessidades de gestão de templos umbandistas, com funcionalidades adaptadas para o contexto religioso e administrativo.

Para dúvidas ou sugestões de melhorias, entre em contato através dos canais de suporte disponíveis.

---

**Desenvolvido com ❤️ para a comunidade umbandista**

