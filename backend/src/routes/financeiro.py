from flask import Blueprint, jsonify, request
from src.auth import admin_required
from src.models.financeiro import Transacao, db

financeiro_bp = Blueprint('financeiro', __name__)

@financeiro_bp.route('/transacoes', methods=['GET'])
@admin_required
def get_transacoes():
    transacoes = Transacao.query.order_by(Transacao.data.desc()).all()
    return jsonify([transacao.to_dict() for transacao in transacoes])

@financeiro_bp.route('/transacoes', methods=['POST'])
@admin_required
def create_transacao():
    data = request.json
    transacao = Transacao(
        descricao=data['descricao'],
        valor=data['valor'],
        tipo=data['tipo'],
        categoria=data['categoria'],
        subcategoria=data.get('subcategoria'),
        membro_id=data.get('membro_id')
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
    data = request.json
    transacao.descricao = data.get('descricao', transacao.descricao)
    transacao.valor = data.get('valor', transacao.valor)
    transacao.tipo = data.get('tipo', transacao.tipo)
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

