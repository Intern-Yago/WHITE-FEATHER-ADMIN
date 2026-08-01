from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from . import db

class Membro(db.Model):
    __tablename__ = 'membros'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    telefone = db.Column(db.String(20))
    email = db.Column(db.String(200))
    endereco = db.Column(db.Text)
    data_nascimento = db.Column(db.Date)
    data_ingresso = db.Column(db.Date, default=lambda: datetime.now(timezone.utc).date())
    valor_mensalidade = db.Column(db.Float, default=0.0)
    ativo = db.Column(db.Boolean, default=True)
    observacoes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'telefone': self.telefone,
            'email': self.email,
            'endereco': self.endereco,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'data_ingresso': self.data_ingresso.isoformat() if self.data_ingresso else None,
            'valor_mensalidade': self.valor_mensalidade,
            'ativo': self.ativo,
            'observacoes': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class PagamentoMensalidade(db.Model):
    __tablename__ = 'pagamentos_mensalidade'
    
    id = db.Column(db.Integer, primary_key=True)
    membro_id = db.Column(db.Integer, db.ForeignKey('membros.id'), nullable=False)
    mes_referencia = db.Column(db.String(7), nullable=False)  # formato: YYYY-MM
    valor_pago = db.Column(db.Float, nullable=False)
    data_pagamento = db.Column(db.Date, default=lambda: datetime.now(timezone.utc).date())
    observacoes = db.Column(db.Text)
    transacao_id = db.Column(db.Integer, db.ForeignKey('transacoes.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    membro = db.relationship('Membro', backref='pagamentos')
    transacao = db.relationship('Transacao', backref='pagamento_origem', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'membro_id': self.membro_id,
            'membro_nome': self.membro.nome if self.membro else None,
            'mes_referencia': self.mes_referencia,
            'valor_pago': self.valor_pago,
            'data_pagamento': self.data_pagamento.isoformat() if self.data_pagamento else None,
            'observacoes': self.observacoes,
            'transacao_id': self.transacao_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


