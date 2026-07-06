import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, AlertTriangle, DollarSign, Trash2, Edit, Settings } from 'lucide-react'

export function Estoque() {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ajusteDialogOpen, setAjusteDialogOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState(null)
  const [ajustandoProduto, setAjustandoProduto] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    codigo: '',
    preco: '',
    quantidade: '',
    categoria: '',
    fornecedor: ''
  })
  const [novaQuantidade, setNovaQuantidade] = useState('')

  useEffect(() => {
    fetchProdutos()
  }, [])

  const fetchProdutos = async () => {
    try {
      const response = await apiFetch('/produtos')
      const data = await response.json()
      setProdutos(data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingProduto 
        ? `/produtos/${editingProduto.id}`
        : '/produtos'
      
      const method = editingProduto ? 'PUT' : 'POST'
      
      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          preco: parseFloat(formData.preco),
          quantidade: parseInt(formData.quantidade)
        }),
      })

      if (response.ok) {
        await fetchProdutos()
        setDialogOpen(false)
        setEditingProduto(null)
        setFormData({
          nome: '', descricao: '', codigo: '', preco: '', 
          quantidade: '', categoria: '', fornecedor: ''
        })
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
    }
  }

  const handleEdit = (produto) => {
    setEditingProduto(produto)
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao || '',
      codigo: produto.codigo,
      preco: produto.preco.toString(),
      quantidade: produto.quantidade.toString(),
      categoria: produto.categoria,
      fornecedor: produto.fornecedor || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await apiFetch(`/produtos/${id}`, { method: 'DELETE' })
        await fetchProdutos()
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
      }
    }
  }

  const handleAjusteEstoque = async (e) => {
    e.preventDefault()
    
    try {
      const response = await apiFetch(`/produtos/${ajustandoProduto.id}/ajustar-estoque`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantidade: parseInt(novaQuantidade)
        }),
      })

      if (response.ok) {
        await fetchProdutos()
        setAjusteDialogOpen(false)
        setAjustandoProduto(null)
        setNovaQuantidade('')
      }
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error)
    }
  }

  const totalProdutos = produtos.length
  const produtosBaixoEstoque = produtos.filter(p => p.quantidade < 10).length
  const valorTotalEstoque = produtos.reduce((sum, p) => sum + (p.preco * p.quantidade), 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Estoque</h1>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie seus produtos e inventário
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProduto(null)
              setFormData({
                nome: '', descricao: '', codigo: '', preco: '', 
                quantidade: '', categoria: '', fornecedor: ''
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduto 
                  ? 'Edite os dados do produto abaixo.'
                  : 'Adicione um novo produto ao estoque.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="preco">Preço</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduto ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProdutos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{produtosBaixoEstoque}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {valorTotalEstoque.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <CardDescription>
            Lista de todos os produtos em estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado. Clique em "Novo Produto" para começar.
            </div>
          ) : (
            <div className="space-y-4">
              {produtos.map((produto) => (
                <div key={produto.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{produto.nome}</h3>
                      <Badge variant="outline">{produto.codigo}</Badge>
                      {produto.quantidade < 10 && (
                        <Badge variant="destructive">Estoque Baixo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {produto.categoria} • {produto.fornecedor || 'Sem fornecedor'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {produto.descricao}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">R$ {produto.preco.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        Qtd: {produto.quantidade}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setAjustandoProduto(produto)
                          setNovaQuantidade(produto.quantidade.toString())
                          setAjusteDialogOpen(true)
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(produto)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(produto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ajuste de estoque */}
      <Dialog open={ajusteDialogOpen} onOpenChange={setAjusteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Ajuste a quantidade em estoque do produto "{ajustandoProduto?.nome}".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAjusteEstoque} className="space-y-4">
            <div>
              <Label htmlFor="nova-quantidade">Nova Quantidade</Label>
              <Input
                id="nova-quantidade"
                type="number"
                value={novaQuantidade}
                onChange={(e) => setNovaQuantidade(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setAjusteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Ajustar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

