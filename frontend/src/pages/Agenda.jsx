import { apiFetch, isAdmin, getUser } from '@/lib/api'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  AlignLeft, 
  Info,
  User,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  XCircle
} from 'lucide-react'

// Helper para obter classes de estilo estáticas do Tailwind
const getColorClasses = (color) => {
  switch (color) {
    case 'rose':
      return {
        dot: 'bg-rose-400',
        badge: 'bg-rose-100 text-rose-800',
        tag: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
      }
    case 'emerald':
      return {
        dot: 'bg-emerald-400',
        badge: 'bg-emerald-100 text-emerald-800',
        tag: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
      }
    case 'sky':
      return {
        dot: 'bg-sky-400',
        badge: 'bg-sky-100 text-sky-800',
        tag: 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
      }
    case 'amber':
      return {
        dot: 'bg-amber-400',
        badge: 'bg-amber-100 text-amber-800',
        tag: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
      }
    case 'purple':
      return {
        dot: 'bg-purple-400',
        badge: 'bg-purple-100 text-purple-800',
        tag: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
      }
    case 'violet':
      return {
        dot: 'bg-violet-400',
        badge: 'bg-violet-100 text-violet-800',
        tag: 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200'
      }
    case 'fuchsia':
      return {
        dot: 'bg-fuchsia-400',
        badge: 'bg-fuchsia-100 text-fuchsia-800',
        tag: 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'
      }
    case 'teal':
      return {
        dot: 'bg-teal-400',
        badge: 'bg-teal-100 text-teal-800',
        tag: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
      }
    case 'orange':
      return {
        dot: 'bg-orange-400',
        badge: 'bg-orange-100 text-orange-800',
        tag: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
      }
    default:
      return {
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-800',
        tag: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
      }
  }
}

const DEFAULT_CATEGORIES = [
  { id: 'aniversario', name: 'Aniversários 🎂', color: 'rose' },
  { id: 'trabalho', name: 'Trabalhos / Giras 🌟', color: 'emerald' },
  { id: 'reuniao', name: 'Reuniões 🤝', color: 'sky' },
  { id: 'outro', name: 'Outros 📌', color: 'slate' }
]

export function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('month') // 'month' | 'week' | 'day'
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Papel do usuário para controle de UI (a segurança real é no backend).
  const admin = isAdmin()
  const currentUser = getUser()
  const currentUserId = currentUser?.id

  // Verifica se o usuário pode editar/excluir um evento:
  // admin pode em qualquer evento customizado; membro só no próprio pendente.
  const canManageEvent = (event) => {
    if (!event || event.id?.toString().startsWith('niver-')) return false
    if (admin) return true
    return event.criado_por_id === currentUserId && event.status === 'pendente'
  }

  // Prefixa eventos pendentes com um marcador de "aguardando aprovação".
  const eventLabel = (event) => (event.status === 'pendente' ? '⏳ ' : '') + event.titulo

  // Mobile filters panel toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Custom categories list stored in localStorage
  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem('white_feather_custom_categories')
    return saved ? JSON.parse(saved) : []
  })

  // Category deletion state for double-action confirmation
  const [deletingCategoryId, setDeletingCategoryId] = useState(null)

  // New category name input
  const [newCategoryName, setNewCategoryName] = useState('')

  // List of all active categories (Default + Custom)
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories]
  
  // Filters state dynamically initialized based on all categories
  const [filters, setFilters] = useState(() => {
    const initial = {
      aniversario: true,
      trabalho: true,
      reuniao: true,
      outro: true
    }
    const saved = localStorage.getItem('white_feather_custom_categories')
    if (saved) {
      const parsed = JSON.parse(saved)
      parsed.forEach(c => {
        initial[c.id] = true
      })
    }
    return initial
  })

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    tipo: 'outro',
    dia_inteiro: false
  })

  // Auto-reset delete confirmation after 3 seconds of inactivity
  useEffect(() => {
    if (deletingCategoryId) {
      const timer = setTimeout(() => {
        setDeletingCategoryId(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [deletingCategoryId])

  // Prevent Week View on mobile resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && currentView === 'week') {
        setCurrentView('day')
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentView])

  // Load events
  const fetchEvents = async () => {
    try {
      const response = await apiFetch('/eventos')
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // Helper for adding dynamic categories
  const handleAddCategory = (e) => {
    e.preventDefault()
    const name = newCategoryName.trim()
    if (!name) return
    
    // Normalize string to use as ID
    const id = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
    
    if (allCategories.some(c => c.id === id)) {
      alert('Esta categoria já existe!')
      return
    }

    const colorPalette = ['amber', 'purple', 'violet', 'fuchsia', 'teal', 'orange']
    const color = colorPalette[customCategories.length % colorPalette.length]

    const newCat = {
      id,
      name,
      color
    }

    const updated = [...customCategories, newCat]
    setCustomCategories(updated)
    localStorage.setItem('white_feather_custom_categories', JSON.stringify(updated))
    
    // Automatically enable filter checkbox
    setFilters(prev => ({ ...prev, [id]: true }))
    setNewCategoryName('')
  }

  // Deleta a categoria personalizada e limpa os filtros correspondentes
  const handleDeleteCategory = (id) => {
    const updated = customCategories.filter(c => c.id !== id)
    setCustomCategories(updated)
    localStorage.setItem('white_feather_custom_categories', JSON.stringify(updated))
    
    // Remove do estado de filtros
    setFilters(prev => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
    
    setDeletingCategoryId(null)
  }

  // Date math helper functions
  const getStartOfWeek = (d) => {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day
    return new Date(date.setDate(diff))
  }

  const getWeekDays = (baseDate) => {
    const start = getStartOfWeek(baseDate)
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      return day
    })
  }

  const getMonthGrid = (baseDate) => {
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const startDay = new Date(firstDay)
    startDay.setDate(firstDay.getDate() - firstDay.getDay())
    
    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(startDay)
      day.setDate(startDay.getDate() + i)
      return day
    })
  }

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate()
  }

  const isToday = (d) => {
    return isSameDay(d, new Date())
  }

  // Navigation handlers
  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handlePrev = () => {
    const newDate = new Date(currentDate)
    if (currentView === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else if (currentView === 'week') {
      newDate.setDate(currentDate.getDate() - 7)
    } else {
      newDate.setDate(currentDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (currentView === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1)
    } else if (currentView === 'week') {
      newDate.setDate(currentDate.getDate() + 7)
    } else {
      newDate.setDate(currentDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  // Format header title
  const getHeaderTitle = () => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    const ano = currentDate.getFullYear()
    const mes = meses[currentDate.getMonth()]

    if (currentView === 'month') {
      return `${mes} de ${ano}`
    } else if (currentView === 'week') {
      const days = getWeekDays(currentDate)
      const first = days[0]
      const last = days[6]
      if (first.getMonth() === last.getMonth()) {
        return `${meses[first.getMonth()]} de ${first.getFullYear()}`
      } else if (first.getFullYear() === last.getFullYear()) {
        return `${meses[first.getMonth()]} – ${meses[last.getMonth()]} de ${first.getFullYear()}`
      } else {
        return `${meses[first.getMonth()]} de ${first.getFullYear()} – ${meses[last.getMonth()]} de ${last.getFullYear()}`
      }
    } else {
      return `${currentDate.getDate()} de ${mes} de ${ano}`
    }
  }

  // Filter events
  const getFilteredEvents = () => {
    return events.filter(e => {
      const type = e.tipo || 'outro'
      return filters[type]
    })
  }

  // Open modal for creating event
  const handleOpenCreate = (dateObj, hour = null) => {
    let startStr = ''
    let endStr = ''
    
    if (dateObj) {
      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      
      if (hour !== null) {
        const startHour = String(hour).padStart(2, '0')
        const endHour = String((hour + 1) % 24).padStart(2, '0')
        startStr = `${year}-${month}-${day}T${startHour}:00`
        endStr = `${year}-${month}-${day}T${endHour}:00`
      } else {
        startStr = `${year}-${month}-${day}T09:00`
        endStr = `${year}-${month}-${day}T10:00`
      }
    } else {
      const now = new Date()
      now.setMinutes(0, 0, 0)
      startStr = now.toISOString().slice(0, 16)
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
      endStr = oneHourLater.toISOString().slice(0, 16)
    }

    setFormData({
      titulo: '',
      descricao: '',
      data_inicio: startStr,
      data_fim: endStr,
      tipo: 'outro',
      dia_inteiro: hour === null
    })
    setSelectedEvent(null)
    setIsCreateOpen(true)
  }

  // Click handler on month day cells
  const handleDayClick = (day, dayEvents) => {
    // On mobile, if day has events, switch to Day view. Otherwise, create event.
    if (window.innerWidth < 640 && dayEvents.length > 0) {
      setCurrentDate(day)
      setCurrentView('day')
    } else {
      handleOpenCreate(day)
    }
  }

  // Open event details view
  const handleOpenView = (event) => {
    setSelectedEvent(event)
    setIsViewOpen(true)
  }

  // Create or Update Event
  const handleSubmitEvent = async (e) => {
    e.preventDefault()
    
    const formattedData = {
      ...formData,
      data_inicio: new Date(formData.data_inicio).toISOString(),
      data_fim: formData.data_fim ? new Date(formData.data_fim).toISOString() : null
    }

    try {
      let response
      if (selectedEvent && !selectedEvent.id.toString().startsWith('niver-')) {
        // Edit
        response = await apiFetch(`/eventos/${selectedEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        })
      } else {
        // Create
        response = await apiFetch('/eventos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        })
      }

      if (response.ok) {
        setIsCreateOpen(false)
        // Membro criando novo evento: vai para aprovação do admin.
        if (!admin && !selectedEvent) {
          alert('Compromisso enviado para aprovação da administração.')
        }
        fetchEvents()
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
    }
  }

  // Aprovar / recusar evento pendente (somente admin).
  const handleAprovar = async () => {
    if (!selectedEvent) return
    try {
      const response = await apiFetch(`/eventos/${selectedEvent.id}/aprovar`, { method: 'POST' })
      if (response.ok) {
        setIsViewOpen(false)
        fetchEvents()
      }
    } catch (error) {
      console.error('Erro ao aprovar evento:', error)
    }
  }

  const handleRecusar = async () => {
    if (!selectedEvent) return
    try {
      const response = await apiFetch(`/eventos/${selectedEvent.id}/recusar`, { method: 'POST' })
      if (response.ok) {
        setIsViewOpen(false)
        fetchEvents()
      }
    } catch (error) {
      console.error('Erro ao recusar evento:', error)
    }
  }

  // Open edit modal for existing event
  const handleOpenEdit = () => {
    if (!selectedEvent || selectedEvent.id.toString().startsWith('niver-')) return
    
    const startStr = new Date(selectedEvent.data_inicio).toISOString().slice(0, 16)
    const endStr = selectedEvent.data_fim 
      ? new Date(selectedEvent.data_fim).toISOString().slice(0, 16)
      : ''

    setFormData({
      titulo: selectedEvent.titulo,
      descricao: selectedEvent.descricao || '',
      data_inicio: startStr,
      data_fim: endStr,
      tipo: selectedEvent.tipo || 'outro',
      dia_inteiro: selectedEvent.dia_inteiro || false
    })
    setIsViewOpen(false)
    setIsCreateOpen(true)
  }

  // Delete event
  const handleDeleteEvent = async () => {
    if (!selectedEvent || selectedEvent.id.toString().startsWith('niver-')) return
    
    if (window.confirm('Tem certeza de que deseja excluir este evento?')) {
      try {
        const response = await apiFetch(`/eventos/${selectedEvent.id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setIsViewOpen(false)
          fetchEvents()
        }
      } catch (error) {
        console.error('Erro ao excluir evento:', error)
      }
    }
  }

  // Obter configurações de cores e nomenclatura da categoria
  const getCategoryConfig = (type) => {
    const cat = allCategories.find(c => c.id === type)
    if (cat) {
      const classes = getColorClasses(cat.color)
      return {
        name: cat.name,
        tag: classes.tag,
        badge: classes.badge,
        dot: classes.dot
      }
    }
    // Fallback padrão
    const classes = getColorClasses('slate')
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      tag: classes.tag,
      badge: classes.badge,
      dot: classes.dot
    }
  }

  // List of hours for Day/Week view (24-hour day)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Agenda do Templo</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground">Firmeza e organização das giras, reuniões e datas comemorativas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Controls */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 text-xs font-semibold">
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <span className="text-sm font-semibold px-2 flex-grow md:flex-grow-0 text-center">
            {getHeaderTitle()}
          </span>

          {/* Views Selector */}
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
            <Button 
              variant={currentView === 'day' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 text-xs" 
              onClick={() => setCurrentView('day')}
            >
              Dia
            </Button>
            <Button 
              variant={currentView === 'week' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 text-xs hidden sm:inline-flex" 
              onClick={() => setCurrentView('week')}
            >
              Semana
            </Button>
            <Button 
              variant={currentView === 'month' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 text-xs" 
              onClick={() => setCurrentView('month')}
            >
              Mês
            </Button>
          </div>

          <Button onClick={() => handleOpenCreate(new Date())} size="sm" className="shadow-sm w-full md:w-auto mt-2 md:mt-0">
            <Plus className="h-4 w-4 mr-1" /> Criar
          </Button>
        </div>
      </div>

      {/* Mobile Filters Toggle Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowMobileFilters(!showMobileFilters)} 
        className="md:hidden w-full justify-between items-center bg-card shadow-sm border py-5 text-sm"
      >
        <span className="flex items-center gap-2 font-medium">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtros e Categorias
        </span>
        <Badge variant="secondary" className="text-xs">
          {showMobileFilters ? 'Ocultar' : 'Mostrar'}
        </Badge>
      </Button>

      {/* Main Grid Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 md:grid-cols-4 md:gap-6 min-h-0">
        
        {/* Sidebar Filters */}
        <div className={`space-y-6 bg-card p-4 rounded-xl border shadow-sm h-fit ${
          showMobileFilters ? 'block animate-fade-in' : 'hidden md:block'
        }`}>
          <div className="space-y-4">
            <Button onClick={() => handleOpenCreate(new Date())} className="w-full justify-start gap-2 shadow-sm mb-2 hidden md:flex" size="lg">
              <Plus className="h-5 w-5" />
              <span>Criar Compromisso</span>
            </Button>

            {/* Filter Group */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Filtros da Agenda</h3>
              
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {allCategories.map(cat => {
                  const config = getCategoryConfig(cat.id)
                  const isDefault = DEFAULT_CATEGORIES.some(d => d.id === cat.id)

                  return (
                    <div key={cat.id} className="flex items-center justify-between rounded-lg hover:bg-muted/50 p-1.5 transition-colors group/cat">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id={`filter-${cat.id}`} 
                          checked={!!filters[cat.id]} 
                          onCheckedChange={(val) => setFilters({ ...filters, [cat.id]: !!val })} 
                        />
                        <Label htmlFor={`filter-${cat.id}`} className="flex items-center gap-2 font-medium cursor-pointer text-sm">
                          <span className={`inline-block w-3 h-3 rounded-full ${config.dot}`} />
                          {cat.name}
                        </Label>
                      </div>

                      {/* Excluir somente categorias personalizadas */}
                      {!isDefault && (
                        <div className="flex items-center shrink-0">
                          {deletingCategoryId === cat.id ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCategory(cat.id)
                              }}
                              className="text-[10px] font-bold text-destructive hover:underline cursor-pointer px-1 animate-pulse"
                            >
                              Confirmar?
                            </button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingCategoryId(cat.id)
                              }}
                              className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover/cat:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Add Custom Category form inline at the end */}
            <form onSubmit={handleAddCategory} className="border-t pt-4 space-y-2">
              <Label htmlFor="new-category" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Criar Nova Categoria
              </Label>
              <div className="flex gap-2">
                <Input 
                  id="new-category" 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
                  placeholder="Ex: Festividade, Limpeza..."
                  className="h-8 text-xs flex-1"
                />
                <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          <div className="border-t pt-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Info className="h-3 w-3" /> Legenda
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              As datas de aniversário dos membros ativos são importadas e geradas de forma automática pelo sistema.
            </p>
          </div>
        </div>

        {/* Calendar views container */}
        <div className="md:col-span-3 bg-card border rounded-xl shadow-sm flex flex-col min-h-0 overflow-hidden">
          
          {/* MONTH VIEW */}
          {currentView === 'month' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Month Header Days */}
              <div className="grid grid-cols-7 border-b text-center py-2 bg-muted/30 text-xs font-semibold text-muted-foreground">
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
              </div>
              
              {/* Month Days Grid */}
              <div className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0 divide-x divide-y border-t bg-muted/5">
                {getMonthGrid(currentDate).map((day, idx) => {
                  const dayEvents = getFilteredEvents().filter(e => isSameDay(new Date(e.data_inicio), day))
                  const dayIsCurrentMonth = day.getMonth() === currentDate.getMonth()
                  
                  return (
                    <div 
                      key={idx} 
                      className={`min-h-0 flex flex-col p-1 hover:bg-accent/20 cursor-pointer group transition-colors relative ${
                        dayIsCurrentMonth ? 'text-foreground' : 'text-muted-foreground bg-muted/10'
                      }`}
                      onClick={() => handleDayClick(day, dayEvents)}
                    >
                      {/* Day Number */}
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${
                          isToday(day) ? 'bg-primary text-primary-foreground font-black' : ''
                        }`}>
                          {day.getDate()}
                        </span>
                        
                        {/* Inline plus button visible on hover */}
                        <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 text-primary transition-opacity hidden sm:block" />
                      </div>

                      {/* Day Events List */}
                      <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                        {/* Desktop event view */}
                        <div className="hidden sm:block space-y-1">
                          {dayEvents.slice(0, 3).map((event) => {
                            const config = getCategoryConfig(event.tipo || 'outro')
                            return (
                              <div 
                                key={event.id}
                                className={`px-1.5 py-0.5 text-[10px] font-medium rounded border truncate transition-all duration-150 ${config.tag}`}
                                onClick={(e) => {
                                  e.stopPropagation() // Prevent day-click trigger
                                  handleOpenView(event)
                                }}
                              >
                                {eventLabel(event)}
                              </div>
                            )
                          })}
                          {dayEvents.length > 3 && (
                            <div 
                              className="text-[9px] font-semibold text-muted-foreground px-1.5 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentDate(day)
                                setCurrentView('day')
                              }}
                            >
                              + {dayEvents.length - 3} mais
                            </div>
                          )}
                        </div>

                        {/* Mobile dots view */}
                        <div className="flex sm:hidden flex-wrap gap-0.5 justify-center mt-1">
                          {dayEvents.slice(0, 4).map((event) => {
                            const config = getCategoryConfig(event.tipo || 'outro')
                            return (
                              <span 
                                key={event.id} 
                                className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                              />
                            )
                          })}
                          {dayEvents.length > 4 && (
                            <span className="text-[7px] text-muted-foreground font-bold leading-none">+</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW - Desktop Only */}
          {currentView === 'week' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              
              {/* Week Grid Header */}
              <div className="grid grid-cols-8 border-b py-2 bg-muted/30 sticky top-0 z-10 text-center">
                <div className="text-xs font-semibold text-muted-foreground flex items-center justify-center border-r">Horário</div>
                {getWeekDays(currentDate).map((day, idx) => {
                  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                  return (
                    <div 
                      key={idx} 
                      className={`py-1 text-xs border-r last:border-r-0 flex flex-col items-center justify-center ${
                        isToday(day) ? 'text-primary' : ''
                      }`}
                    >
                      <span className="font-semibold text-muted-foreground">{diasSemana[day.getDay()]}</span>
                      <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mt-0.5 ${
                        isToday(day) ? 'bg-primary text-primary-foreground font-black' : ''
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Week Grid Body */}
              <div className="flex-1 grid grid-cols-8 divide-x relative bg-muted/5 min-h-[960px]">
                {/* Time indicators column */}
                <div className="flex flex-col border-r bg-card sticky left-0 z-10">
                  {hours.map(hour => (
                    <div key={hour} className="h-10 text-[10px] text-muted-foreground pr-2 text-right relative" style={{ top: '-6px' }}>
                      {`${String(hour).padStart(2, '0')}:00`}
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {getWeekDays(currentDate).map((day, dayIdx) => {
                  const dayEvents = getFilteredEvents().filter(e => isSameDay(new Date(e.data_inicio), day) && !e.dia_inteiro)
                  const dayAllDayEvents = getFilteredEvents().filter(e => isSameDay(new Date(e.data_inicio), day) && e.dia_inteiro)

                  return (
                    <div 
                      key={dayIdx} 
                      className="relative h-[960px] border-r last:border-r-0 hover:bg-accent/5"
                    >
                      {/* All-Day Events row area (at the top) */}
                      {dayAllDayEvents.length > 0 && (
                        <div className="absolute top-0 left-0 right-0 z-20 bg-muted/40 p-1 border-b flex flex-col gap-1 max-h-16 overflow-y-auto">
                          {dayAllDayEvents.map(event => {
                            const config = getCategoryConfig(event.tipo || 'outro')
                            return (
                              <div 
                                key={event.id}
                                className={`px-1.5 py-0.5 text-[9px] font-semibold rounded border truncate cursor-pointer ${config.tag}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenView(event)
                                }}
                              >
                                {eventLabel(event)}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Clickable hourly grid cells */}
                      {hours.map(hour => (
                        <div 
                          key={hour}
                          className="h-10 border-b border-muted/20 cursor-pointer hover:bg-accent/20 transition-colors"
                          onClick={() => handleOpenCreate(day, hour)}
                        />
                      ))}

                      {/* Absolute Positioned Events */}
                      {dayEvents.map(event => {
                        const startDate = new Date(event.data_inicio)
                        const endDate = event.data_fim ? new Date(event.data_fim) : new Date(startDate.getTime() + 60 * 60 * 1000)
                        
                        const startHour = startDate.getHours()
                        const startMin = startDate.getMinutes()
                        
                        const durationHrs = (endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000)
                        
                        const topPosition = (startHour + startMin / 60) * 40 // 40px per hour
                        const heightSize = Math.max(durationHrs * 40, 20) // min 20px
                        
                        const config = getCategoryConfig(event.tipo || 'outro')

                        return (
                          <div
                            key={event.id}
                            className={`absolute left-1 right-1 p-1 text-[10px] font-medium rounded border overflow-hidden cursor-pointer flex flex-col justify-between shadow-sm z-10 select-none ${config.tag}`}
                            style={{ 
                              top: `${topPosition}px`, 
                              height: `${heightSize}px` 
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenView(event)
                            }}
                          >
                            <div className="font-bold truncate">{eventLabel(event)}</div>
                            <div className="text-[9px] opacity-80 flex items-center gap-0.5 mt-0.5">
                              <Clock className="h-2 w-2" />
                              {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {currentView === 'day' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              
              {/* Day All-Day Events row header */}
              {getFilteredEvents().filter(e => isSameDay(new Date(e.data_inicio), currentDate) && e.dia_inteiro).length > 0 && (
                <div className="p-3 border-b bg-muted/40 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase mr-2">O Dia Todo:</span>
                  {getFilteredEvents().filter(e => isSameDay(new Date(e.data_inicio), currentDate) && e.dia_inteiro).map(event => {
                    const config = getCategoryConfig(event.tipo || 'outro')
                    return (
                      <div 
                        key={event.id}
                        className={`px-3 py-1 text-xs font-semibold rounded border cursor-pointer ${config.tag}`}
                        onClick={() => handleOpenView(event)}
                      >
                        {eventLabel(event)}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Day Grid Body */}
              <div className="flex-1 grid grid-cols-8 divide-x relative bg-muted/5 min-h-[960px]">
                {/* Time indicators */}
                <div className="col-span-1 flex flex-col border-r bg-card sticky left-0 z-10">
                  {hours.map(hour => (
                    <div key={hour} className="h-10 text-[10px] md:text-xs text-muted-foreground pr-1 md:pr-3 text-right relative" style={{ top: '-6px' }}>
                      {`${String(hour).padStart(2, '0')}:00`}
                    </div>
                  ))}
                </div>

                {/* Day column */}
                <div className="col-span-7 relative h-[960px]">
                  {hours.map(hour => (
                    <div 
                      key={hour}
                      className="h-10 border-b border-muted/20 cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => handleOpenCreate(currentDate, hour)}
                    />
                  ))}

                  {/* Day Events */}
                  {getFilteredEvents()
                    .filter(e => isSameDay(new Date(e.data_inicio), currentDate) && !e.dia_inteiro)
                    .map(event => {
                      const startDate = new Date(event.data_inicio)
                      const endDate = event.data_fim ? new Date(event.data_fim) : new Date(startDate.getTime() + 60 * 60 * 1000)
                      
                      const startHour = startDate.getHours()
                      const startMin = startDate.getMinutes()
                      
                      const durationHrs = (endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000)
                      
                      const topPosition = (startHour + startMin / 60) * 40
                      const heightSize = Math.max(durationHrs * 40, 24)
                      
                      const config = getCategoryConfig(event.tipo || 'outro')

                      return (
                        <div
                          key={event.id}
                          className={`absolute left-1 right-2 md:left-2 md:right-4 p-2 text-xs font-medium rounded-lg border shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] z-10 ${config.tag}`}
                          style={{ 
                            top: `${topPosition}px`, 
                            height: `${heightSize}px` 
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenView(event)
                          }}
                        >
                          <div>
                            <div className="font-bold truncate text-[11px] md:text-xs">{eventLabel(event)}</div>
                            {event.descricao && <div className="text-[9px] md:text-[10px] opacity-75 line-clamp-2 mt-0.5 hidden sm:block">{event.descricao}</div>}
                          </div>
                          <div className="text-[9px] md:text-[10px] opacity-80 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CREATE / EDIT EVENT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1">
              <Sparkles className="h-5 w-5 text-primary" />
              {selectedEvent ? 'Editar Compromisso' : 'Adicionar Novo Compromisso'}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes do compromisso no calendário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEvent} className="space-y-4">
            <div>
              <Label htmlFor="evt-titulo">Título</Label>
              <Input 
                id="evt-titulo" 
                value={formData.titulo} 
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} 
                placeholder="Ex: Gira de Baianos, Reunião de Doutrina..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="evt-tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(val) => setFormData({ ...formData, tipo: val })}>
                  <SelectTrigger id="evt-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox 
                  id="evt-diainteiro" 
                  checked={formData.dia_inteiro} 
                  onCheckedChange={(val) => setFormData({ ...formData, dia_inteiro: !!val })} 
                />
                <Label htmlFor="evt-diainteiro" className="cursor-pointer text-sm font-medium">Dia Inteiro</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="evt-inicio">Início</Label>
                <Input 
                  id="evt-inicio" 
                  type={formData.dia_inteiro ? "date" : "datetime-local"} 
                  value={formData.data_inicio} 
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="evt-fim">Fim</Label>
                <Input 
                  id="evt-fim" 
                  type={formData.dia_inteiro ? "date" : "datetime-local"} 
                  value={formData.data_fim} 
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="evt-desc">Descrição</Label>
              <Textarea 
                id="evt-desc" 
                value={formData.descricao} 
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} 
                placeholder="Detalhes sobre o evento..."
                rows={3}
              />
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Compromisso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW EVENT DETAILS DIALOG */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <DialogTitle className="text-xl font-bold">{selectedEvent.titulo}</DialogTitle>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <Badge className={getCategoryConfig(selectedEvent.tipo || 'outro').badge}>
                        {getCategoryConfig(selectedEvent.tipo || 'outro').name}
                      </Badge>
                      {selectedEvent.dia_inteiro && (
                        <Badge variant="outline">O Dia Todo</Badge>
                      )}
                      {selectedEvent.status === 'pendente' && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Aguardando aprovação
                        </Badge>
                      )}
                      {selectedEvent.status === 'recusado' && (
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          Recusado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Time info */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <div>
                    <div className="font-medium text-foreground">
                      {new Date(selectedEvent.data_inicio).toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                    {!selectedEvent.dia_inteiro && (
                      <div className="text-xs">
                        {new Date(selectedEvent.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {selectedEvent.data_fim && ` – ${new Date(selectedEvent.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedEvent.descricao && (
                  <div className="flex items-start gap-3 text-sm text-muted-foreground border-t pt-3">
                    <AlignLeft className="h-4 w-4 mt-0.5" />
                    <p className="leading-relaxed whitespace-pre-line">{selectedEvent.descricao}</p>
                  </div>
                )}

                {/* Virtual birthday member info */}
                {selectedEvent.id.toString().startsWith('niver-') && (
                  <div className="flex items-center gap-3 text-xs bg-muted p-2 rounded-lg border mt-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      Este aniversário é gerado automaticamente a partir do cadastro do membro.
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-between items-center w-full border-t pt-4 gap-2">
                {selectedEvent.id.toString().startsWith('niver-') ? (
                  // Read only birthday
                  <>
                    <div className="text-xs text-muted-foreground">Compromisso Automático</div>
                    <Button variant="outline" size="sm" onClick={() => setIsViewOpen(false)}>Fechar</Button>
                  </>
                ) : (
                  <>
                    <div>
                      {canManageEvent(selectedEvent) && (
                        <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" size="sm" onClick={handleDeleteEvent}>
                          <Trash2 className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setIsViewOpen(false)}>Fechar</Button>
                      {admin && selectedEvent.status === 'pendente' && (
                        <>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleRecusar}>
                            <XCircle className="h-4 w-4 mr-1" /> Recusar
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAprovar}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                          </Button>
                        </>
                      )}
                      {canManageEvent(selectedEvent) && (
                        <Button size="sm" onClick={handleOpenEdit}>Editar</Button>
                      )}
                    </div>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
