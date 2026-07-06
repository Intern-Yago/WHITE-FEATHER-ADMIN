import { apiFetch, isAdmin } from '@/lib/api'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Package, AlertTriangle, DollarSign, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export function Materiais() {
  // Membro comum pode ver e movimentar estoque, mas não criar/editar/excluir.
  const admin = isAdmin()
  const [materiais, setMateriais] = useState([])
  const [movimentacoes, setMovimentacoes] = useState([])
  const [categorias, setCategorias] = useState({ categorias: [], subcategorias: {} })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [movimentacaoDialogOpen, setMovimentacaoDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [materialMovimentacao, setMaterialMovimentacao] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    subcategoria: '',
    unidade_medida: 'unidade',
    preco_unitario: '',
    quantidade_atual: '',
    quantidade_minima: '5',
    fornecedor: '',
    local_armazenamento: '',
    observacoes: ''
  })
  const [movimentacaoData, setMovimentacaoData] = useState({
    tipo_movimentacao: '',
    quantidade: '',
    motivo: '',
    observacoes: ''
  })

  useEffect(() => {
    fetchMateriais()
    fetchMovimentacoes()
    fetchCategorias()
  }, [])

  const fetchMateriais = async () => {
    try {
      const response = await apiFetch('/materiais')
      const data = await response.json()
      setMateriais(data)
    } catch (error) {
      console.error('Erro ao carregar materiais:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMovimentacoes = async () => {
    try {
      const response = await apiFetch('/movimentacoes')
      const data = await response.json()
      setMovimentacoes(data)
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await apiFetch('/categorias-materiais')
      const data = await response.json()
      setCategorias(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const handleSubmitMaterial = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingMaterial 
        ? `/materiais/${editingMaterial.id}`
        : '/materiais'
      
      const method = editingMaterial ? 'PUT' : 'POST'
      
      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          preco_unitario: parseFloat(formData.preco_unitario),
          quantidade_atual: parseFloat(formData.quantidade_atual) || 0,
          quantidade_minima: parseFloat(formData.quantidade_minima) || 5
        }),
      })

      if (response.ok) {
        await fetchMateriais()
        await fetchMovimentacoes()
        setDialogOpen(false)
        setEditingMaterial(null)
        setFormData({
          nome: '', descricao: '', categoria: '', subcategoria: '',
          unidade_medida: 'unidade', preco_unitario: '', quantidade_atual: '',
          quantidade_minima: '5', fornecedor: '', local_armazenamento: '', observacoes: ''
        })
      }
    } catch (error) {
      console.error('Erro ao salvar material:', error)
    }
  }

  const handleSubmitMovimentacao = async (e) => {
    e.preventDefault()
    
    try {
      const response = await apiFetch(`/materiais/${materialMovimentacao.id}/movimentar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...movimentacaoData,
          quantidade: parseFloat(movimentacaoData.quantidade)
        }),
      })

      if (response.ok) {
        await fetchMateriais()
        await fetchMovimentacoes()
        setMovimentacaoDialogOpen(false)
        setMaterialMovimentacao(null)
        setMovimentacaoData({
          tipo_movimentacao: '', quantidade: '', motivo: '', observacoes: ''
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao movimentar estoque')
      }
    } catch (error) {
      console.error('Erro ao movimentar estoque:', error)
    }
  }

  const handleEdit = (material) => {
    setEditingMaterial(material)
    setFormData({
      nome: material.nome,
      descricao: material.descricao || '',
      categoria: material.categoria,
      subcategoria: material.subcategoria || '',
      unidade_medida: material.unidade_medida,
      preco_unitario: material.preco_unitario.toString(),
      quantidade_atual: material.quantidade_atual.toString(),
      quantidade_minima: material.quantidade_minima.toString(),
      fornecedor: material.fornecedor || '',
      local_armazenamento: material.local_armazenamento || '',
      observacoes: material.observacoes || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja remover este material?')) {
      try {
        await apiFetch(`/materiais/${id}`, { method: 'DELETE' })
        await fetchMateriais()
      } catch (error) {
        console.error('Erro ao remover material:', error)
      }
    }
  }

  const totalMateriais = materiais.length
  const materiaisBaixoEstoque = materiais.filter(m => m.estoque_baixo).length
  const valorTotalEstoque = materiais.reduce((sum, m) => sum + m.valor_total, 0)

  const getMovimentacaoIcon = (tipo) => {
    switch (tipo) {
      case 'entrada': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'saida': return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'ajuste': return <ArrowUpDown className="h-4 w-4 text-blue-600" />
      default: return <ArrowUpDown className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Materiais</h1>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Materiais Religiosos</h1>
          <p className="text-muted-foreground">
            Gerencie o estoque de materiais do templo
          </p>
        </div>
        
        {admin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingMaterial(null)
              setFormData({
                nome: '', descricao: '', categoria: '', subcategoria: '',
                unidade_medida: 'unidade', preco_unitario: '', quantidade_atual: '',
                quantidade_minima: '5', fornecedor: '', local_armazenamento: '', observacoes: ''
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </DialogTitle>
              <DialogDescription>
                {editingMaterial 
                  ? 'Edite os dados do material abaixo.'
                  : 'Adicione um novo material ao estoque do templo.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitMaterial} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Material</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Vela Branca 7 Dias"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value, subcategoria: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subcategoria">Subcategoria</Label>
                  <Select value={formData.subcategoria} onValueChange={(value) => setFormData({ ...formData, subcategoria: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.categoria && categorias.subcategorias[formData.categoria]?.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unidade_medida">Unidade de Medida</Label>
                  <Select value={formData.unidade_medida} onValueChange={(value) => setFormData({ ...formData, unidade_medida: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidade">Unidade</SelectItem>
                      <SelectItem value="kg">Quilograma</SelectItem>
                      <SelectItem value="g">Grama</SelectItem>
                      <SelectItem value="litro">Litro</SelectItem>
                      <SelectItem value="ml">Mililitro</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="pacote">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada do material"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="preco_unitario">Preço Unitário</Label>
                  <Input
                    id="preco_unitario"
                    type="number"
                    step="0.01"
                    value={formData.preco_unitario}
                    onChange={(e) => setFormData({ ...formData, preco_unitario: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quantidade_atual">Quantidade Atual</Label>
                  <Input
                    id="quantidade_atual"
                    type="number"
                    step="0.01"
                    value={formData.quantidade_atual}
                    onChange={(e) => setFormData({ ...formData, quantidade_atual: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="quantidade_minima">Quantidade Mínima</Label>
                  <Input
                    id="quantidade_minima"
                    type="number"
                    step="0.01"
                    value={formData.quantidade_minima}
                    onChange={(e) => setFormData({ ...formData, quantidade_minima: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div>
                  <Label htmlFor="local_armazenamento">Local de Armazenamento</Label>
                  <Input
                    id="local_armazenamento"
                    value={formData.local_armazenamento}
                    onChange={(e) => setFormData({ ...formData, local_armazenamento: e.target.value })}
                    placeholder="Ex: Armário 1, Prateleira A"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingMaterial ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Materiais</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMateriais}</div>
            <p className="text-xs text-muted-foreground">
              Materiais cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{materiaisBaixoEstoque}</div>
            <p className="text-xs text-muted-foreground">
              Materiais com estoque baixo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {valorTotalEstoque.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total do estoque
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="materiais" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="materiais">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Materiais</CardTitle>
              <CardDescription>
                Todos os materiais religiosos do templo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {materiais.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum material encontrado. Clique em "Novo Material" para começar.
                </div>
              ) : (
                <div className="space-y-4">
                  {materiais.map((material) => (
                    <div key={material.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{material.nome}</h3>
                          <Badge variant="outline">{material.categoria}</Badge>
                          {material.subcategoria && (
                            <Badge variant="secondary">{material.subcategoria}</Badge>
                          )}
                          {material.estoque_baixo && (
                            <Badge variant="destructive">Estoque Baixo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {material.quantidade_atual} {material.unidade_medida} • 
                          R$ {material.preco_unitario.toFixed(2)}/{material.unidade_medida}
                          {material.local_armazenamento && ` • ${material.local_armazenamento}`}
                        </p>
                        {material.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {material.descricao}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-row items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-right">
                          <div className="font-bold">R$ {material.valor_total.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            Valor total
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setMaterialMovimentacao(material)
                              setMovimentacaoData({
                                tipo_movimentacao: '', quantidade: '', motivo: '', observacoes: ''
                              })
                              setMovimentacaoDialogOpen(true)
                            }}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                          {admin && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(material)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete(material.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentacoes">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>
                Registro de entradas, saídas e ajustes de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movimentacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma movimentação registrada.
                </div>
              ) : (
                <div className="space-y-4">
                  {movimentacoes.map((mov) => (
                    <div key={mov.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {getMovimentacaoIcon(mov.tipo_movimentacao)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{mov.material_nome}</h3>
                            <Badge variant={
                              mov.tipo_movimentacao === 'entrada' ? 'default' :
                              mov.tipo_movimentacao === 'saida' ? 'destructive' : 'secondary'
                            }>
                              {mov.tipo_movimentacao}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {mov.motivo} • {new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}
                            {mov.observacoes && ` • ${mov.observacoes}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                        <span className={`font-bold ${
                          mov.tipo_movimentacao === 'entrada' ? 'text-green-600' :
                          mov.tipo_movimentacao === 'saida' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {mov.tipo_movimentacao === 'entrada' ? '+' : 
                           mov.tipo_movimentacao === 'saida' ? '-' : '='} {mov.quantidade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para movimentação de estoque */}
      <Dialog open={movimentacaoDialogOpen} onOpenChange={setMovimentacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar Estoque</DialogTitle>
            <DialogDescription>
              Registre entrada, saída ou ajuste do material "{materialMovimentacao?.nome}".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitMovimentacao} className="space-y-4">
            <div>
              <Label htmlFor="tipo_movimentacao">Tipo de Movimentação</Label>
              <Select value={movimentacaoData.tipo_movimentacao} onValueChange={(value) => setMovimentacaoData({ ...movimentacaoData, tipo_movimentacao: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantidade_mov">Quantidade</Label>
              <Input
                id="quantidade_mov"
                type="number"
                step="0.01"
                value={movimentacaoData.quantidade}
                onChange={(e) => setMovimentacaoData({ ...movimentacaoData, quantidade: e.target.value })}
                placeholder={`Atual: ${materialMovimentacao?.quantidade_atual || 0} ${materialMovimentacao?.unidade_medida || ''}`}
                required
              />
            </div>
            <div>
              <Label htmlFor="motivo">Motivo</Label>
              <Input
                id="motivo"
                value={movimentacaoData.motivo}
                onChange={(e) => setMovimentacaoData({ ...movimentacaoData, motivo: e.target.value })}
                placeholder="Ex: Compra, Uso em ritual, Correção de estoque"
                required
              />
            </div>
            <div>
              <Label htmlFor="observacoes_mov">Observações</Label>
              <Textarea
                id="observacoes_mov"
                value={movimentacaoData.observacoes}
                onChange={(e) => setMovimentacaoData({ ...movimentacaoData, observacoes: e.target.value })}
                placeholder="Observações adicionais"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setMovimentacaoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

