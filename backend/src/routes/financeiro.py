from flask import Blueprint, jsonify, request
from src.auth import admin_required
from src.models.financeiro import Transacao, db

from datetime import datetime

financeiro_bp = Blueprint('financeiro', __name__)

@financeiro_bp.route('/transacoes', methods=['GET'])
@admin_required
def get_transacoes():
    query = Transacao.query
    
    tipo = request.args.get('tipo')
    if tipo in ('receita', 'despesa'):
        query = query.filter(Transacao.tipo == tipo)

    categoria = request.args.get('categoria')
    if categoria:
        query = query.filter(Transacao.categoria == categoria)

    transacoes = query.order_by(Transacao.data.desc()).all()
    return jsonify([transacao.to_dict() for transacao in transacoes])

@financeiro_bp.route('/transacoes', methods=['POST'])
@admin_required
def create_transacao():
    data = request.json or {}

    if not data.get('descricao') or not str(data.get('descricao')).strip():
        return jsonify({'error': 'Descrição é obrigatória'}), 400
    if not data.get('tipo') or data.get('tipo') not in ('receita', 'despesa'):
        return jsonify({'error': 'Tipo deve ser "receita" ou "despesa"'}), 400
    if not data.get('categoria') or not str(data.get('categoria')).strip():
        return jsonify({'error': 'Categoria é obrigatória'}), 400

    try:
        valor = float(data.get('valor', 0))
        if valor <= 0:
            return jsonify({'error': 'Valor da transação deve ser maior que zero'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Valor da transação inválido'}), 400

    data_trans = datetime.now()
    if data.get('data'):
        try:
            data_trans = datetime.fromisoformat(data['data'].replace('Z', '+00:00'))
        except ValueError:
            pass

    transacao = Transacao(
        descricao=str(data['descricao']).strip(),
        valor=valor,
        tipo=data['tipo'],
        categoria=str(data['categoria']).strip(),
        subcategoria=data.get('subcategoria'),
        membro_id=data.get('membro_id'),
        data=data_trans
    )
    db.session.add(transacao)
    db.session.commit()
    return jsonify(transacao.to_dict()), 201

@financeiro_bp.route('/transacoes/<int:transacao_id>', methods=['GET'])
@admin_required
def get_transacao(transacao_id):
    transacao = Transacao.query.get_or_404(transacao_id)
    return jsonify(transacao.to_dict())

@financeiro_bp.route('/transacoes/<int:transacao_id>', methods=['PUT'])
@admin_required
def update_transacao(transacao_id):
    transacao = Transacao.query.get_or_404(transacao_id)
    data = request.json or {}

    if 'valor' in data:
        try:
            val = float(data['valor'])
            if val <= 0:
                return jsonify({'error': 'Valor deve ser maior que zero'}), 400
            transacao.valor = val
        except (ValueError, TypeError):
            return jsonify({'error': 'Valor inválido'}), 400

    if 'tipo' in data:
        if data['tipo'] not in ('receita', 'despesa'):
            return jsonify({'error': 'Tipo inválido'}), 400
        transacao.tipo = data['tipo']

    transacao.descricao = data.get('descricao', transacao.descricao)
    transacao.categoria = data.get('categoria', transacao.categoria)
    transacao.subcategoria = data.get('subcategoria', transacao.subcategoria)
    transacao.membro_id = data.get('membro_id', transacao.membro_id)
    db.session.commit()
    return jsonify(transacao.to_dict())

@financeiro_bp.route('/transacoes/<int:transacao_id>', methods=['DELETE'])
@admin_required
def delete_transacao(transacao_id):
    transacao = Transacao.query.get_or_404(transacao_id)
    db.session.delete(transacao)
    db.session.commit()
    return '', 204


@financeiro_bp.route('/resumo-financeiro', methods=['GET'])
@admin_required
def get_resumo_financeiro():
    receitas = db.session.query(db.func.sum(Transacao.valor)).filter(Transacao.tipo == 'receita').scalar() or 0
    despesas = db.session.query(db.func.sum(Transacao.valor)).filter(Transacao.tipo == 'despesa').scalar() or 0
    saldo = receitas - despesas
    
    # Receitas por categoria
    receitas_por_categoria = db.session.query(
        Transacao.categoria,
        db.func.sum(Transacao.valor)
    ).filter(Transacao.tipo == 'receita').group_by(Transacao.categoria).all()
    
    # Despesas por categoria
    despesas_por_categoria = db.session.query(
        Transacao.categoria,
        db.func.sum(Transacao.valor)
    ).filter(Transacao.tipo == 'despesa').group_by(Transacao.categoria).all()
    
    return jsonify({
        'receitas': receitas,
        'despesas': despesas,
        'saldo': saldo,
        'receitas_por_categoria': [{'categoria': cat, 'valor': val} for cat, val in receitas_por_categoria],
        'despesas_por_categoria': [{'categoria': cat, 'valor': val} for cat, val in despesas_por_categoria]
    })

@financeiro_bp.route('/categorias', methods=['GET'])
@admin_required
def get_categorias():
    categorias_receita = [
        'Mensalidades',
        'Doações',
        'Eventos e Festivais',
        'Consultas Espirituais',
        'Trabalhos Espirituais',
        'Vendas de Materiais',
        'Outras Receitas'
    ]
    
    categorias_despesa = [
        'Materiais Religiosos',
        'Manutenção do Templo',
        'Energia Elétrica',
        'Água',
        'Internet/Telefone',
        'Limpeza',
        'Alimentação (Eventos)',
        'Transporte',
        'Documentação',
        'Outras Despesas'
    ]
    
    return jsonify({
        'receita': categorias_receita,
        'despesa': categorias_despesa
    })

