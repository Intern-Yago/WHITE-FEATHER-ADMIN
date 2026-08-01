import { apiFetch, isAdmin, getUser } from '@/lib/api'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Package, TrendingUp, AlertTriangle, Users, Calendar, Wallet, CheckCircle2, AlertCircle } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'


function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-24 mb-1"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Dashboard reduzido para membros comuns: sem dados financeiros gerais.
function MemberDashboard() {
  const [minhas, setMinhas] = useState(null)
  const [resumoMateriais, setResumoMateriais] = useState(null)
  const [proximosEventos, setProximosEventos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [minhasRes, materiaisRes, eventosRes] = await Promise.all([
          apiFetch('/minhas-mensalidades'),
          apiFetch('/resumo-estoque'),
          apiFetch('/eventos')
        ])

        setMinhas(await minhasRes.json())
        setResumoMateriais(await materiaisRes.json())

        const eventos = await eventosRes.json()
        const agora = new Date()
        const futuros = eventos
          .filter(e => e.status !== 'recusado' && new Date(e.data_inicio) >= agora)
          .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio))
          .slice(0, 5)
        setProximosEventos(futuros)
      } catch (error) {
        console.error('Erro ao carregar resumos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDados()
  }, [])

  if (loading) return <DashboardSkeleton />

  const pago = minhas?.pago_mes_atual
  const user = getUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo(a){minhas?.membro?.nome ? `, ${minhas.membro.nome}` : user?.username ? `, ${user.username}` : ''}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minha Mensalidade</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(minhas?.valor_mensalidade || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Valor mensal</p>
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
            <p className="text-xs text-muted-foreground">Mensalidade do mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiais em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumoMateriais?.total_materiais || 0}
            </div>
            <p className="text-xs text-muted-foreground">Materiais cadastrados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>Agenda do templo</CardDescription>
        </CardHeader>
        <CardContent>
          {proximosEventos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhum evento futuro na agenda.
            </div>
          ) : (
            <div className="space-y-3">
              {proximosEventos.map((evento) => (
                <div key={evento.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium truncate">{evento.titulo}</span>
                    {evento.status === 'pendente' && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 shrink-0">
                        Aguardando aprovação
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
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

// Dashboard completo para administradores.
function AdminDashboard() {
  const [resumoFinanceiro, setResumoFinanceiro] = useState(null)
  const [resumoMateriais, setResumoMateriais] = useState(null)
  const [resumoMembros, setResumoMembros] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResumos = async () => {
      try {
        const [financeiroRes, materiaisRes, membrosRes] = await Promise.all([
          apiFetch('/resumo-financeiro'),
          apiFetch('/resumo-estoque'),
          apiFetch('/resumo-membros')
        ])

        const financeiro = await financeiroRes.json()
        const materiais = await materiaisRes.json()
        const membros = await membrosRes.json()

        setResumoFinanceiro(financeiro)
        setResumoMateriais(materiais)
        setResumoMembros(membros)
      } catch (error) {
        console.error('Erro ao carregar resumos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResumos()
  }, [])

  if (loading) return <DashboardSkeleton />

  const barData = [
    {
      name: 'Balanço Geral',
      Receitas: resumoFinanceiro?.receitas || 0,
      Despesas: resumoFinanceiro?.despesas || 0,
    }
  ]

  const pieColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1']
  const receitasPieData = resumoFinanceiro?.receitas_por_categoria?.map(item => ({
    name: item.categoria,
    value: item.valor
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Tenda Espírita Caboclo Pena Branca
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Atual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (resumoFinanceiro?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              R$ {resumoFinanceiro?.saldo?.toFixed(2) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Membros
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {resumoMembros?.total_membros || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Membros ativos do templo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Materiais em Estoque
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumoMateriais?.total_materiais || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Materiais religiosos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receitas do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {resumoMembros?.receita_mes_atual?.toFixed(2) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensalidades recebidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Materiais em Falta
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {resumoMateriais?.materiais_baixo_estoque || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Materiais com estoque baixo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Membros Inadimplentes
            </CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {resumoMembros?.membros_inadimplentes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensalidades em atraso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Financeiros */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Balanço Receitas vs Despesas</CardTitle>
            <CardDescription>Comparativo financeiro total</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => `R$${val}`} />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, '']} />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receitas por Categoria</CardTitle>
            <CardDescription>Distribuição de entradas</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {receitasPieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Nenhuma receita cadastrada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={receitasPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {receitasPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`R$ ${Number(val).toFixed(2)}`, 'Valor']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>
              Situação financeira atual do templo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Receitas Totais:</span>
              <span className="text-sm text-green-600 font-medium">
                R$ {resumoFinanceiro?.receitas?.toFixed(2) || '0,00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Despesas Totais:</span>
              <span className="text-sm text-red-600 font-medium">
                R$ {resumoFinanceiro?.despesas?.toFixed(2) || '0,00'}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="font-medium">Saldo Atual:</span>
                <span className={`font-medium ${
                  (resumoFinanceiro?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {resumoFinanceiro?.saldo?.toFixed(2) || '0,00'}
                </span>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Receita Esperada/Mês:</span>
                <span className="text-sm font-medium">
                  R$ {resumoMembros?.receita_esperada_mensal?.toFixed(2) || '0,00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Membros</CardTitle>
            <CardDescription>
              Informações sobre os membros do templo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total de Membros:</span>
              <span className="text-sm font-medium">
                {resumoMembros?.total_membros || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Receita Esperada:</span>
              <span className="text-sm text-green-600 font-medium">
                R$ {resumoMembros?.receita_esperada_mensal?.toFixed(2) || '0,00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Receita do Mês:</span>
              <span className="text-sm text-blue-600 font-medium">
                R$ {resumoMembros?.receita_mes_atual?.toFixed(2) || '0,00'}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Inadimplentes:</span>
                <span className="text-sm text-red-600 font-medium">
                  {resumoMembros?.membros_inadimplentes || 0}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Taxa de Adimplência:</span>
              <span className="font-medium text-green-600">
                {resumoMembros?.percentual_adimplencia?.toFixed(1) || '0'}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Materiais</CardTitle>
          <CardDescription>
            Situação do estoque de materiais religiosos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center border-b sm:border-b-0 sm:border-r pb-4 sm:pb-0 last:border-0">
              <div className="text-2xl font-bold">{resumoMateriais?.total_materiais || 0}</div>
              <div className="text-sm text-muted-foreground">Total de Materiais</div>
            </div>
            <div className="text-center border-b sm:border-b-0 sm:border-r pb-4 sm:pb-0 last:border-0">
              <div className="text-2xl font-bold text-orange-600">{resumoMateriais?.materiais_baixo_estoque || 0}</div>
              <div className="text-sm text-muted-foreground">Estoque Baixo</div>
            </div>
            <div className="text-center last:border-0">
              <div className="text-2xl font-bold text-green-600">
                R$ {resumoMateriais?.valor_total_estoque?.toFixed(2) || '0,00'}
              </div>
              <div className="text-sm text-muted-foreground">Valor Total</div>
            </div>
          </div>

          {resumoMateriais?.materiais_por_categoria && resumoMateriais.materiais_por_categoria.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Materiais por Categoria:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {resumoMateriais.materiais_por_categoria.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.categoria}:</span>
                    <span className="font-medium">{item.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function Dashboard() {
  return isAdmin() ? <AdminDashboard /> : <MemberDashboard />
}
