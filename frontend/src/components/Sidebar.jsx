import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getUser, clearSession } from '@/lib/api'
import { Button } from '@/components/ui/button'
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
  User as UserIcon
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
    navigate('/login')
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
            <div className="p-4 border-t border-sidebar-border space-y-3">
              <div className="flex items-center gap-2.5 px-2">
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
