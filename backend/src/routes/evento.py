from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, date
from src.auth import admin_required, is_admin, get_current_user
from src.models.evento import Evento, db
from src.models.membro import Membro

evento_bp = Blueprint('evento', __name__)

@evento_bp.route('/eventos', methods=['GET'])
@jwt_required()
def get_eventos():
    # 1. Buscar eventos customizados, respeitando o papel do usuário.
    #    - Admin: vê todos os eventos (qualquer status).
    #    - Membro: vê os aprovados + os próprios (pendentes/recusados).
    if is_admin():
        eventos = Evento.query.order_by(Evento.data_inicio).all()
    else:
        user = get_current_user()
        eventos = Evento.query.filter(
            db.or_(
                Evento.status == 'aprovado',
                Evento.criado_por_id == (user.id if user else None)
            )
        ).order_by(Evento.data_inicio).all()

    lista_eventos = [e.to_dict() for e in eventos]

    # 2. Buscar membros ativos com data de nascimento cadastrada
    membros = Membro.query.filter_by(ativo=True).filter(Membro.data_nascimento.isnot(None)).all()

    # Gerar eventos de aniversário para o ano anterior, atual e posterior
    ano_atual = datetime.now().year
    anos_para_gerar = [ano_atual - 1, ano_atual, ano_atual + 1]

    for membro in membros:
        for ano in anos_para_gerar:
            try:
                # Tratar anos bissextos (aniversário 29 de fevereiro)
                data_niver = date(ano, membro.data_nascimento.month, membro.data_nascimento.day)
            except ValueError:
                # Se for 29 de fev e não for bissexto, move para 28 de fev
                data_niver = date(ano, 2, 28)

            lista_eventos.append({
                'id': f"niver-{membro.id}-{ano}",  # ID virtual para diferenciar dos eventos customizados
                'titulo': f"🎂 Aniversário: {membro.nome}",
                'descricao': f"Aniversário de {membro.nome} (nascido(a) em {membro.data_nascimento.strftime('%d/%m/%Y')})",
                'data_inicio': datetime.combine(data_niver, datetime.min.time()).isoformat(),
                'data_fim': datetime.combine(data_niver, datetime.max.time()).isoformat(),
                'tipo': 'aniversario',
                'dia_inteiro': True,
                'status': 'aprovado',
                'membro_id': membro.id
            })

    return jsonify(lista_eventos)

@evento_bp.route('/eventos', methods=['POST'])
@jwt_required()
def create_evento():
    data = request.json

    try:
        data_inicio = datetime.fromisoformat(data['data_inicio'].replace('Z', '+00:00'))
        data_fim = None
        if data.get('data_fim'):
            data_fim = datetime.fromisoformat(data['data_fim'].replace('Z', '+00:00'))
    except (ValueError, KeyError):
        return jsonify({'error': 'Datas de início e fim inválidas ou ausentes'}), 400

    user = get_current_user()
    # Admin cria eventos já aprovados; membro cria pendente (vai para aprovação).
    status = 'aprovado' if is_admin() else 'pendente'

    evento = Evento(
        titulo=data['titulo'],
        descricao=data.get('descricao'),
        data_inicio=data_inicio,
        data_fim=data_fim,
        tipo=data.get('tipo', 'outro'),
        dia_inteiro=data.get('dia_inteiro', False),
        status=status,
        criado_por_id=user.id if user else None
    )

    db.session.add(evento)
    db.session.commit()
    return jsonify(evento.to_dict()), 201

@evento_bp.route('/eventos/<int:evento_id>', methods=['PUT'])
@jwt_required()
def update_evento(evento_id):
    evento = Evento.query.get_or_404(evento_id)

    # Membro só pode editar o próprio evento enquanto ainda estiver pendente.
    if not is_admin():
        user = get_current_user()
        if evento.criado_por_id != (user.id if user else None) or evento.status != 'pendente':
            return jsonify({'error': 'Acesso negado'}), 403

    data = request.json

    try:
        if 'data_inicio' in data:
            evento.data_inicio = datetime.fromisoformat(data['data_inicio'].replace('Z', '+00:00'))
        if 'data_fim' in data:
            if data.get('data_fim'):
                evento.data_fim = datetime.fromisoformat(data['data_fim'].replace('Z', '+00:00'))
            else:
                evento.data_fim = None
    except ValueError:
        return jsonify({'error': 'Datas de início ou fim inválidas'}), 400

    evento.titulo = data.get('titulo', evento.titulo)
    evento.descricao = data.get('descricao', evento.descricao)
    evento.tipo = data.get('tipo', evento.tipo)
    evento.dia_inteiro = data.get('dia_inteiro', evento.dia_inteiro)

    db.session.commit()
    return jsonify(evento.to_dict())

@evento_bp.route('/eventos/<int:evento_id>', methods=['DELETE'])
@jwt_required()
def delete_evento(evento_id):
    evento = Evento.query.get_or_404(evento_id)

    # Membro só pode excluir o próprio evento enquanto ainda estiver pendente.
    if not is_admin():
        user = get_current_user()
        if evento.criado_por_id != (user.id if user else None) or evento.status != 'pendente':
            return jsonify({'error': 'Acesso negado'}), 403

    db.session.delete(evento)
    db.session.commit()
    return '', 204

@evento_bp.route('/eventos/<int:evento_id>/aprovar', methods=['POST'])
@admin_required
def aprovar_evento(evento_id):
    evento = Evento.query.get_or_404(evento_id)
    evento.status = 'aprovado'
    db.session.commit()
    return jsonify(evento.to_dict())

@evento_bp.route('/eventos/<int:evento_id>/recusar', methods=['POST'])
@admin_required
def recusar_evento(evento_id):
    evento = Evento.query.get_or_404(evento_id)
    evento.status = 'recusado'
    db.session.commit()
    return jsonify(evento.to_dict())
