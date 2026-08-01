import os
import sys
import time
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import inspect, text
from src.models import db
from src.routes.user import user_bp
from src.routes.financeiro import financeiro_bp
from src.routes.estoque import estoque_bp
from src.routes.membro import membro_bp
from src.routes.evento import evento_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
# Chaves secretas devem vir do ambiente. O fallback só existe para desenvolvimento local.
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-only-change-me')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', app.config['SECRET_KEY'])
# Tempo de expiração do token de acesso (padrão: 8 horas)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.environ.get('JWT_EXPIRES_SECONDS', 8 * 3600))

jwt = JWTManager(app)

# Configurar CORS para permitir comunicação com frontend
CORS(app, origins=os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(','))

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(financeiro_bp, url_prefix='/api')
app.register_blueprint(estoque_bp, url_prefix='/api')
app.register_blueprint(membro_bp, url_prefix='/api')
app.register_blueprint(evento_bp, url_prefix='/api')

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Wait for DB to be ready and create tables
with app.app_context():
    retries = 5
    while retries > 0:
        try:
            db.create_all()

            # Migração leve/idempotente: adicionar colunas novas em `eventos` e `pagamentos_mensalidade`
            # (db.create_all() não altera tabelas já existentes).
            inspector = inspect(db.engine)
            if 'eventos' in inspector.get_table_names():
                colunas = {c['name'] for c in inspector.get_columns('eventos')}
                with db.engine.begin() as conn:
                    if 'status' not in colunas:
                        conn.execute(text(
                            "ALTER TABLE eventos ADD COLUMN status VARCHAR(20) DEFAULT 'aprovado'"
                        ))
                    if 'criado_por_id' not in colunas:
                        conn.execute(text(
                            "ALTER TABLE eventos ADD COLUMN criado_por_id INTEGER"
                        ))

            if 'pagamentos_mensalidade' in inspector.get_table_names():
                colunas = {c['name'] for c in inspector.get_columns('pagamentos_mensalidade')}
                if 'transacao_id' not in colunas:
                    with db.engine.begin() as conn:
                        conn.execute(text(
                            "ALTER TABLE pagamentos_mensalidade ADD COLUMN transacao_id INTEGER"
                        ))

            # Seed default users
            from src.models.user import User
            from src.models.membro import Membro

            # 1 admin (senha via ambiente; fallback apenas para desenvolvimento)
            if not User.query.filter_by(username='admin').first():
                admin = User(username='admin', email='admin@whitefeather.com', role='admin')
                admin.set_password(os.environ.get('ADMIN_PASSWORD', 'admin123'))
                db.session.add(admin)

            # 3 usuários normais (com membro associado)
            usuarios_padrao = [
                {
                    'username': 'usuario1',
                    'email': 'usuario1@whitefeather.com',
                    'password': os.environ.get('SEED_USER_PASSWORD', 'usuario123'),
                    'membro': {
                        'nome': 'João da Silva',
                        'telefone': '11999999991',
                        'email': 'joao@email.com',
                        'endereco': 'Rua das Flores, 123',
                        'valor_mensalidade': 50.0,
                    },
                },
                {
                    'username': 'usuario2',
                    'email': 'usuario2@whitefeather.com',
                    'password': os.environ.get('SEED_USER_PASSWORD', 'usuario123'),
                    'membro': {
                        'nome': 'Maria Souza',
                        'telefone': '11999999992',
                        'email': 'maria@email.com',
                        'endereco': 'Av. Central, 456',
                        'valor_mensalidade': 50.0,
                    },
                },
                {
                    'username': 'usuario3',
                    'email': 'usuario3@whitefeather.com',
                    'password': os.environ.get('SEED_USER_PASSWORD', 'usuario123'),
                    'membro': {
                        'nome': 'Pedro Santos',
                        'telefone': '11999999993',
                        'email': 'pedro@email.com',
                        'endereco': 'Praça da Matriz, 789',
                        'valor_mensalidade': 50.0,
                    },
                },
            ]

            for u in usuarios_padrao:
                if User.query.filter_by(username=u['username']).first():
                    continue
                membro_ref = Membro.query.filter_by(nome=u['membro']['nome']).first()
                if not membro_ref:
                    membro_ref = Membro(**u['membro'])
                    db.session.add(membro_ref)
                    db.session.commit()
                novo = User(
                    username=u['username'],
                    email=u['email'],
                    role='membro',
                    membro_id=membro_ref.id
                )
                novo.set_password(u['password'])
                db.session.add(novo)

            db.session.commit()
            break
        except Exception as e:
            retries -= 1
            print(f"Database not ready. Retrying in 2 seconds... ({retries} retries left). Error: {e}")
            time.sleep(2)
    else:
        # If it still fails, let it crash/restart
        db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    # debug NUNCA deve ficar ligado em produção (o debugger do Werkzeug permite RCE).
    debug = os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')
    app.run(host='0.0.0.0', port=5000, debug=debug)
