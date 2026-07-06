import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, CheckCircle2, AlertCircle } from 'lucide-react'

export function MinhasMensalidades() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const response = await apiFetch('/minhas-mensalidades')
        const data = await response.json()
        setDados(data)
      } catch (error) {
        console.error('Erro ao carregar mensalidades:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDados()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Minhas Mensalidades</h1>
        <div className="animate-pulse grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!dados || !dados.membro) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Minhas Mensalidades</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Sua conta ainda não está vinculada a um cadastro de membro. Fale com a
            administração do templo para regularizar.
          </CardContent>
        </Card>
      </div>
    )
  }

  const pago = dados.pago_mes_atual
  const mesAtualLabel = dados.mes_atual
    ? new Date(dados.mes_atual + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minhas Mensalidades</h1>
        <p className="text-muted-foreground">
          Olá, {dados.membro.nome}. Aqui está a sua situação de mensalidades.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor da Mensalidade</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(dados.valor_mensalidade || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Situação do Mês</CardTitle>
            {pago
              ? <CheckCircle2 className="h-4 w-4 text-green-600" />
              : <AlertCircle className="h-4 w-4 text-orange-600" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pago ? 'text-green-600' : 'text-orange-600'}`}>
              {pago ? 'Em dia' : 'Pendente'}
            </div>
            <p className="text-xs text-muted-foreground capitalize">{mesAtualLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Registrados</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dados.pagamentos.length}</div>
            <p className="text-xs text-muted-foreground">No histórico</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Registro das suas mensalidades pagas</CardDescription>
        </CardHeader>
        <CardContent>
          {dados.pagamentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento registrado ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {dados.pagamentos.map((pagamento) => (
                <div key={pagamento.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        {new Date(pagamento.mes_referencia + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pago em {new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')}
                      {pagamento.observacoes && ` • ${pagamento.observacoes}`}
                    </p>
                  </div>
                  <span className="font-bold text-green-600">
                    R$ {pagamento.valor_pago.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
