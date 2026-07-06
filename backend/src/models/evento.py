from datetime import datetime
from . import db

class Evento(db.Model):
    __tablename__ = 'eventos'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text)
    data_inicio = db.Column(db.DateTime, nullable=False)
    data_fim = db.Column(db.DateTime)
    tipo = db.Column(db.String(50), default='outro') # aniversario, gira, reuniao, outro
    dia_inteiro = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='aprovado')  # pendente, aprovado, recusado
    criado_por_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'data_inicio': self.data_inicio.isoformat() if self.data_inicio else None,
            'data_fim': self.data_fim.isoformat() if self.data_fim else None,
            'tipo': self.tipo,
            'dia_inteiro': self.dia_inteiro,
            'status': self.status,
            'criado_por_id': self.criado_por_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
