import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getUser, clearSession, apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  DollarSign,
  Package,
  Home,
  Menu,
  X,
  Users,
  Calendar,
  LogOut,
  Wallet,
  User as UserIcon,
  KeyRound
} from 'lucide-react'

// `adminOnly`: visível só para admin. `memberOnly`: visível só para membro comum.
const menuItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home
  },
  {
    title: 'Financeiro',
    href: '/financeiro',
    icon: DollarSign,
    adminOnly: true
  },
  {
    title: 'Minhas Mensalidades',
    href: '/minhas-mensalidades',
    icon: Wallet,
    memberOnly: true
  },
  {
    title: 'Materiais',
    href: '/materiais',
    icon: Package
  },
  {
    title: 'Membros',
    href: '/membros',
    icon: Users
  },
  {
    title: 'Agenda',
    href: '/agenda',
    icon: Calendar
  }
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const loadUser = () => {
      setUser(getUser())
    }

    loadUser()
    window.addEventListener('auth-change', loadUser)
    return () => window.removeEventListener('auth-change', loadUser)
  }, [])

  const handleLogout = () => {
    clearSession()
    toast.info('Sessão encerrada.')
    navigate('/login')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    setPasswordLoading(true)
    try {
      const response = await apiFetch('/change-password', {
        method: 'POST',
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Senha alterada com sucesso!')
        setPasswordDialogOpen(false)
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.error || 'Erro ao alterar senha.')
      }
    } catch (err) {
      toast.error(err.message || 'Erro de conexão.')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Filtrar itens com base no papel do usuário.
  const isAdmin = user?.role === 'admin'
  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    if (item.memberOnly && isAdmin) return false
    return true
  })

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border">
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Tenda Espírita Caboclo Pena Branca
            </h2>
            <p className="text-sm text-sidebar-foreground/60">
              Sistema de Gestão
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User profile and logout area at the bottom */}
          {user && (
            <div className="p-4 border-t border-sidebar-border space-y-2">
              <div className="flex items-center gap-2.5 px-2 mb-2">
                <div className="p-1.5 bg-sidebar-accent rounded-full text-sidebar-accent-foreground">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold truncate text-sidebar-foreground">
                    {user.username}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/50 uppercase font-black">
                    {user.role === 'admin' ? 'Administrador' : 'Membro'}
                  </p>
                </div>
              </div>
              
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-xs text-muted-foreground hover:text-sidebar-foreground"
                    size="sm"
                  >
                    <KeyRound className="h-3.5 w-3.5 mr-2" />
                    Alterar Senha
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                    <DialogDescription>
                      Digite sua senha atual e escolha uma nova senha segura.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <Label htmlFor="old_password">Senha Atual</Label>
                      <Input
                        id="old_password"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="new_password">Nova Senha</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={passwordLoading}>
                        {passwordLoading ? 'Salvando...' : 'Atualizar Senha'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                size="sm"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sair da Conta
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-[10px] text-sidebar-foreground/40 text-center">
              Sistema de Gestão v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

