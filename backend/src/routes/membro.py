from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, date
from src.auth import admin_required, is_admin, get_current_user
from src.models.membro import Membro, PagamentoMensalidade, db

from src.models.financeiro import Transacao

membro_bp = Blueprint('membro', __name__)

def membro_public_dict(membro):
    """Dados de membro visíveis para usuários não-admin: apenas nome e telefone."""
    return {
        'id': membro.id,
        'nome': membro.nome,
        'telefone': membro.telefone,
    }


@membro_bp.route('/membros', methods=['GET'])
@jwt_required()
def get_membros():
    membros = Membro.query.filter_by(ativo=True).order_by(Membro.nome).all()
    if is_admin():
        return jsonify([membro.to_dict() for membro in membros])
    return jsonify([membro_public_dict(membro) for membro in membros])

@membro_bp.route('/membros', methods=['POST'])
@admin_required
def create_membro():
    data = request.json or {}
    if not data.get('nome') or not str(data.get('nome')).strip():
        return jsonify({'error': 'Nome é obrigatório'}), 400

    valor_mensalidade = float(data.get('valor_mensalidade', 0.0) or 0.0)
    if valor_mensalidade < 0:
        return jsonify({'error': 'Valor da mensalidade não pode ser negativo'}), 400

    # Converter data de nascimento se fornecida
    data_nascimento = None
    if data.get('data_nascimento'):
        try:
            data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Data de nascimento inválida'}), 400

    membro = Membro(
        nome=data['nome'].strip(),
        telefone=data.get('telefone'),
        email=data.get('email'),
        endereco=data.get('endereco'),
        data_nascimento=data_nascimento,
        valor_mensalidade=valor_mensalidade,
        observacoes=data.get('observacoes')
    )
    db.session.add(membro)
    db.session.commit()
    return jsonify(membro.to_dict()), 201

@membro_bp.route('/membros/<int:membro_id>', methods=['GET'])
@jwt_required()
def get_membro(membro_id):
    membro = Membro.query.get_or_404(membro_id)
    if is_admin():
        return jsonify(membro.to_dict())
    return jsonify(membro_public_dict(membro))

@membro_bp.route('/membros/<int:membro_id>', methods=['PUT'])
@admin_required
def update_membro(membro_id):
    membro = Membro.query.get_or_404(membro_id)
    data = request.json or {}

    if 'valor_mensalidade' in data:
        valor_mensalidade = float(data.get('valor_mensalidade', 0.0) or 0.0)
        if valor_mensalidade < 0:
            return jsonify({'error': 'Valor da mensalidade não pode ser negativo'}), 400
        membro.valor_mensalidade = valor_mensalidade

    membro.nome = data.get('nome', membro.nome)
    membro.telefone = data.get('telefone', membro.telefone)
    membro.email = data.get('email', membro.email)
    membro.endereco = data.get('endereco', membro.endereco)
    membro.observacoes = data.get('observacoes', membro.observacoes)

    if data.get('data_nascimento'):
        try:
            membro.data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Data de nascimento inválida'}), 400

    db.session.commit()
    return jsonify(membro.to_dict())

@membro_bp.route('/membros/<int:membro_id>', methods=['DELETE'])
@admin_required
def delete_membro(membro_id):
    membro = Membro.query.get_or_404(membro_id)
    membro.ativo = False  # Soft delete
    db.session.commit()
    return '', 204

@membro_bp.route('/membros/<int:membro_id>/pagamentos', methods=['GET'])
@jwt_required()
def get_pagamentos_membro(membro_id):
    # Admin vê qualquer um; membro só vê os próprios pagamentos.
    if not is_admin():
        user = get_current_user()
        if not user or user.membro_id != membro_id:
            return jsonify({'error': 'Acesso negado'}), 403
    pagamentos = PagamentoMensalidade.query.filter_by(membro_id=membro_id).order_by(PagamentoMensalidade.mes_referencia.desc()).all()
    return jsonify([pagamento.to_dict() for pagamento in pagamentos])

@membro_bp.route('/pagamentos-mensalidade', methods=['GET'])
@admin_required
def get_pagamentos():
    pagamentos = PagamentoMensalidade.query.order_by(PagamentoMensalidade.data_pagamento.desc()).all()
    return jsonify([pagamento.to_dict() for pagamento in pagamentos])

@membro_bp.route('/pagamentos-mensalidade', methods=['POST'])
@admin_required
def create_pagamento():
    data = request.json or {}

    if not data.get('membro_id') or not data.get('mes_referencia') or data.get('valor_pago') is None:
        return jsonify({'error': 'membro_id, mes_referencia e valor_pago são obrigatórios'}), 400

    try:
        valor_pago = float(data['valor_pago'])
        if valor_pago <= 0:
            return jsonify({'error': 'Valor pago deve ser maior que zero'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Valor pago inválido'}), 400

    membro = Membro.query.get_or_404(data['membro_id'])

    # Verificar se já existe pagamento para este membro no mês
    existing = PagamentoMensalidade.query.filter_by(
        membro_id=membro.id,
        mes_referencia=data['mes_referencia']
    ).first()

    if existing:
        return jsonify({'error': 'Já existe pagamento para este membro neste mês'}), 400

    # Determinar data do pagamento
    data_pag = datetime.now().date()
    if data.get('data_pagamento'):
        try:
            data_pag = datetime.strptime(data['data_pagamento'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Data de pagamento inválida'}), 400

    # Sincronizar: Criar Transacao de receita financeira correspondente
    transacao = Transacao(
        descricao=f"Mensalidade - {membro.nome} ({data['mes_referencia']})",
        valor=valor_pago,
        tipo='receita',
        categoria='Mensalidades',
        membro_id=membro.id,
        data=datetime.combine(data_pag, datetime.min.time())
    )
    db.session.add(transacao)
    db.session.flush()  # obter id da transacao

    pagamento = PagamentoMensalidade(
        membro_id=membro.id,
        mes_referencia=data['mes_referencia'],
        valor_pago=valor_pago,
        data_pagamento=data_pag,
        observacoes=data.get('observacoes'),
        transacao_id=transacao.id
    )

    db.session.add(pagamento)
    db.session.commit()
    return jsonify(pagamento.to_dict()), 201

@membro_bp.route('/pagamentos-mensalidade/<int:pagamento_id>', methods=['DELETE'])
@admin_required
def delete_pagamento(pagamento_id):
    pagamento = PagamentoMensalidade.query.get_or_404(pagamento_id)
    if pagamento.transacao_id:
        transacao = Transacao.query.get(pagamento.transacao_id)
        if transacao:
            db.session.delete(transacao)

    db.session.delete(pagamento)
    db.session.commit()
    return '', 204


@membro_bp.route('/membros/inadimplentes', methods=['GET'])
@admin_required
def get_membros_inadimplentes():
    # Pegar mês atual
    mes_atual = datetime.now().strftime('%Y-%m')

    # Buscar membros ativos que não pagaram este mês
    membros_ativos = Membro.query.filter_by(ativo=True).all()
    inadimplentes = []

    for membro in membros_ativos:
        pagamento_mes = PagamentoMensalidade.query.filter_by(
            membro_id=membro.id,
            mes_referencia=mes_atual
        ).first()

        if not pagamento_mes and membro.valor_mensalidade > 0:
            inadimplentes.append(membro.to_dict())

    return jsonify(inadimplentes)

@membro_bp.route('/resumo-membros', methods=['GET'])
@admin_required
def get_resumo_membros():
    total_membros = Membro.query.filter_by(ativo=True).count()

    # Receita mensal esperada
    receita_esperada = db.session.query(db.func.sum(Membro.valor_mensalidade)).filter_by(ativo=True).scalar() or 0

    # Receita do mês atual
    mes_atual = datetime.now().strftime('%Y-%m')
    receita_mes = db.session.query(db.func.sum(PagamentoMensalidade.valor_pago)).filter_by(mes_referencia=mes_atual).scalar() or 0

    # Membros inadimplentes
    membros_ativos = Membro.query.filter_by(ativo=True).all()
    inadimplentes = 0

    for membro in membros_ativos:
        pagamento_mes = PagamentoMensalidade.query.filter_by(
            membro_id=membro.id,
            mes_referencia=mes_atual
        ).first()

        if not pagamento_mes and membro.valor_mensalidade > 0:
            inadimplentes += 1

    return jsonify({
        'total_membros': total_membros,
        'receita_esperada_mensal': receita_esperada,
        'receita_mes_atual': receita_mes,
        'membros_inadimplentes': inadimplentes,
        'percentual_adimplencia': ((total_membros - inadimplentes) / total_membros * 100) if total_membros > 0 else 0
    })

@membro_bp.route('/minhas-mensalidades', methods=['GET'])
@jwt_required()
def get_minhas_mensalidades():
    """Situação financeira do próprio usuário logado (membro vinculado)."""
    user = get_current_user()

    if not user or not user.membro_id:
        # Usuário sem membro vinculado (ex.: admin sem cadastro) — estrutura vazia amigável.
        return jsonify({
            'membro': None,
            'valor_mensalidade': 0,
            'pago_mes_atual': False,
            'pagamentos': []
        })

    membro = Membro.query.get(user.membro_id)
    if not membro:
        return jsonify({
            'membro': None,
            'valor_mensalidade': 0,
            'pago_mes_atual': False,
            'pagamentos': []
        })

    mes_atual = datetime.now().strftime('%Y-%m')
    pagamentos = PagamentoMensalidade.query.filter_by(
        membro_id=membro.id
    ).order_by(PagamentoMensalidade.mes_referencia.desc()).all()

    pago_mes_atual = any(p.mes_referencia == mes_atual for p in pagamentos)

    return jsonify({
        'membro': {
            'id': membro.id,
            'nome': membro.nome,
        },
        'valor_mensalidade': membro.valor_mensalidade,
        'pago_mes_atual': pago_mes_atual,
        'mes_atual': mes_atual,
        'pagamentos': [p.to_dict() for p in pagamentos]
    })
