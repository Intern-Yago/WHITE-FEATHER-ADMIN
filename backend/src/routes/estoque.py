from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from src.auth import admin_required
from src.models.estoque import Material, MovimentacaoEstoque, db

estoque_bp = Blueprint('estoque', __name__)

@estoque_bp.route('/materiais', methods=['GET'])
@jwt_required()
def get_materiais():
    materiais = Material.query.filter_by(ativo=True).order_by(Material.categoria, Material.nome).all()
    return jsonify([material.to_dict() for material in materiais])

@estoque_bp.route('/materiais', methods=['POST'])
@admin_required
def create_material():
    data = request.json
    material = Material(
        nome=data['nome'],
        descricao=data.get('descricao', ''),
        categoria=data['categoria'],
        subcategoria=data.get('subcategoria'),
        unidade_medida=data.get('unidade_medida', 'unidade'),
        preco_unitario=data['preco_unitario'],
        quantidade_atual=data.get('quantidade_atual', 0),
        quantidade_minima=data.get('quantidade_minima', 5),
        fornecedor=data.get('fornecedor', ''),
        local_armazenamento=data.get('local_armazenamento', ''),
        observacoes=data.get('observacoes', '')
    )
    db.session.add(material)
    db.session.commit()
    
    # Registrar movimentação inicial se quantidade > 0
    if material.quantidade_atual > 0:
        movimentacao = MovimentacaoEstoque(
            material_id=material.id,
            tipo_movimentacao='entrada',
            quantidade=material.quantidade_atual,
            motivo='Estoque inicial'
        )
        db.session.add(movimentacao)
        db.session.commit()
    
    return jsonify(material.to_dict()), 201

@estoque_bp.route('/materiais/<int:material_id>', methods=['GET'])
@jwt_required()
def get_material(material_id):
    material = Material.query.get_or_404(material_id)
    return jsonify(material.to_dict())

@estoque_bp.route('/materiais/<int:material_id>', methods=['PUT'])
@admin_required
def update_material(material_id):
    material = Material.query.get_or_404(material_id)
    data = request.json
    
    material.nome = data.get('nome', material.nome)
    material.descricao = data.get('descricao', material.descricao)
    material.categoria = data.get('categoria', material.categoria)
    material.subcategoria = data.get('subcategoria', material.subcategoria)
    material.unidade_medida = data.get('unidade_medida', material.unidade_medida)
    material.preco_unitario = data.get('preco_unitario', material.preco_unitario)
    material.quantidade_minima = data.get('quantidade_minima', material.quantidade_minima)
    material.fornecedor = data.get('fornecedor', material.fornecedor)
    material.local_armazenamento = data.get('local_armazenamento', material.local_armazenamento)
    material.observacoes = data.get('observacoes', material.observacoes)
    
    db.session.commit()
    return jsonify(material.to_dict())

@estoque_bp.route('/materiais/<int:material_id>', methods=['DELETE'])
@admin_required
def delete_material(material_id):
    material = Material.query.get_or_404(material_id)
    material.ativo = False  # Soft delete
    db.session.commit()
    return '', 204

@estoque_bp.route('/materiais/<int:material_id>/movimentar', methods=['POST'])
@jwt_required()
def movimentar_estoque(material_id):
    material = Material.query.get_or_404(material_id)
    data = request.json
    
    tipo = data['tipo_movimentacao']  # 'entrada', 'saida', 'ajuste'
    quantidade = float(data['quantidade'])
    motivo = data['motivo']
    
    # Validar movimentação de saída
    if tipo == 'saida' and material.quantidade_atual < quantidade:
        return jsonify({'error': 'Quantidade insuficiente em estoque'}), 400
    
    # Atualizar quantidade do material
    if tipo == 'entrada':
        material.quantidade_atual += quantidade
    elif tipo == 'saida':
        material.quantidade_atual -= quantidade
    elif tipo == 'ajuste':
        material.quantidade_atual = quantidade
    
    # Registrar movimentação
    movimentacao = MovimentacaoEstoque(
        material_id=material_id,
        tipo_movimentacao=tipo,
        quantidade=quantidade,
        motivo=motivo,
        observacoes=data.get('observacoes')
    )
    
    db.session.add(movimentacao)
    db.session.commit()
    
    return jsonify(material.to_dict())

@estoque_bp.route('/materiais/<int:material_id>/movimentacoes', methods=['GET'])
@jwt_required()
def get_movimentacoes_material(material_id):
    movimentacoes = MovimentacaoEstoque.query.filter_by(material_id=material_id).order_by(MovimentacaoEstoque.data_movimentacao.desc()).all()
    return jsonify([mov.to_dict() for mov in movimentacoes])

@estoque_bp.route('/movimentacoes', methods=['GET'])
@jwt_required()
def get_movimentacoes():
    movimentacoes = MovimentacaoEstoque.query.order_by(MovimentacaoEstoque.data_movimentacao.desc()).limit(50).all()
    return jsonify([mov.to_dict() for mov in movimentacoes])

@estoque_bp.route('/resumo-estoque', methods=['GET'])
@jwt_required()
def get_resumo_estoque():
    total_materiais = Material.query.filter_by(ativo=True).count()
    materiais_baixo_estoque = Material.query.filter(
        Material.ativo == True,
        Material.quantidade_atual <= Material.quantidade_minima
    ).count()
    
    valor_total_estoque = db.session.query(
        db.func.sum(Material.preco_unitario * Material.quantidade_atual)
    ).filter_by(ativo=True).scalar() or 0
    
    # Materiais por categoria
    materiais_por_categoria = db.session.query(
        Material.categoria,
        db.func.count(Material.id)
    ).filter_by(ativo=True).group_by(Material.categoria).all()
    
    return jsonify({
        'total_materiais': total_materiais,
        'materiais_baixo_estoque': materiais_baixo_estoque,
        'valor_total_estoque': valor_total_estoque,
        'materiais_por_categoria': [{'categoria': cat, 'quantidade': qtd} for cat, qtd in materiais_por_categoria]
    })

@estoque_bp.route('/categorias-materiais', methods=['GET'])
@jwt_required()
def get_categorias_materiais():
    categorias = [
        'Velas',
        'Ervas',
        'Incensos',
        'Óleos Essenciais',
        'Cristais e Pedras',
        'Imagens e Santos',
        'Instrumentos Musicais',
        'Tecidos e Roupas',
        'Bebidas Ritualísticas',
        'Flores',
        'Charutos e Cigarros',
        'Perfumes',
        'Pólvoras e Pemba',
        'Utensílios Diversos',
        'Limpeza do Templo',
        'Outros Materiais'
    ]
    
    subcategorias = {
        'Velas': ['Branca', 'Vermelha', 'Azul', 'Amarela', 'Verde', 'Rosa', 'Roxa', 'Preta', 'Dourada', 'Prateada'],
        'Ervas': ['Arruda', 'Guiné', 'Alecrim', 'Manjericão', 'Espada de São Jorge', 'Comigo-ninguém-pode', 'Outras'],
        'Incensos': ['Sândalo', 'Mirra', 'Benjoim', 'Olíbano', 'Lavanda', 'Rosa', 'Outros'],
        'Cristais e Pedras': ['Quartzo Branco', 'Ametista', 'Citrino', 'Hematita', 'Obsidiana', 'Outros'],
        'Instrumentos Musicais': ['Atabaque', 'Agogô', 'Xequerê', 'Caxixi', 'Outros']
    }
    
    return jsonify({
        'categorias': categorias,
        'subcategorias': subcategorias
    })

