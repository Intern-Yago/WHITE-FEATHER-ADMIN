from functools import wraps

from flask import jsonify
from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    verify_jwt_in_request,
)


def admin_required(fn):
    """Exige um JWT válido cujo claim 'role' seja 'admin'."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Acesso restrito a administradores'}), 403
        return fn(*args, **kwargs)

    return wrapper


def is_admin():
    """True se o JWT atual tem o claim 'role' == 'admin'.

    Deve ser chamado dentro de uma rota protegida por @jwt_required()/@admin_required.
    """
    return get_jwt().get('role') == 'admin'


def get_current_user():
    """Retorna o objeto User do JWT atual (ou None).

    A identidade do token é o `user.id` (string). Import local para evitar
    dependência circular com o módulo de modelos.
    """
    from src.models.user import User

    identity = get_jwt_identity()
    if identity is None:
        return None
    return User.query.get(int(identity))
