from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required
from src.auth import admin_required, get_current_user
from src.models.user import User, db
from src.models.membro import Membro

user_bp = Blueprint('user', __name__)

ROLES_VALIDAS = {'admin', 'membro'}

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Usuário e senha são obrigatórios'}), 400

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role}
        )
        return jsonify({
            'success': True,
            'token': access_token,
            'user': user.to_dict()
        })
    return jsonify({'error': 'Usuário ou senha incorretos'}), 401

@user_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    data = request.json or {}
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not old_password or not new_password:
        return jsonify({'error': 'Senha antiga e nova senha são obrigatórias'}), 400

    if not user.check_password(old_password):
        return jsonify({'error': 'Senha atual incorreta'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'A nova senha deve ter no mínimo 6 caracteres'}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Senha alterada com sucesso'})

@user_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    data = request.json or {}

    if not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'error': 'Username, email e password são obrigatórios'}), 400

    if len(data.get('password', '')) < 6:
        return jsonify({'error': 'A senha deve ter no mínimo 6 caracteres'}), 400

    role = data.get('role', 'membro')
    if role not in ROLES_VALIDAS:
        return jsonify({'error': 'Role inválida'}), 400

    # Verificar duplicidade
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Nome de usuário já está em uso'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'E-mail já está em uso'}), 400

    user = User(
        username=data['username'].strip(),
        email=data['email'].strip(),
        role=role,
        membro_id=data.get('membro_id')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json or {}

    if 'role' in data and data['role'] not in ROLES_VALIDAS:
        return jsonify({'error': 'Role inválida'}), 400

    if data.get('password') and len(data['password']) < 6:
        return jsonify({'error': 'A nova senha deve ter no mínimo 6 caracteres'}), 400

    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    user.role = data.get('role', user.role)
    user.membro_id = data.get('membro_id', user.membro_id)

    if data.get('password'):
        user.set_password(data['password'])

    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204

