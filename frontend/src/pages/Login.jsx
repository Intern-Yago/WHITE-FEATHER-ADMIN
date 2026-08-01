import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, CalendarDays, Lock } from 'lucide-react'
import { apiFetch, setSession } from '@/lib/api'

import { toast } from 'sonner'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSession(data.token, data.user)
        toast.success(`Bem-vindo(a), ${data.user.username}!`)
        navigate('/')
      } else {
        setError(data.error || 'Erro ao realizar login.')
        toast.error(data.error || 'Erro ao realizar login.')
      }
    } catch (err) {
      console.error(err)
      setError('Erro de conexão com o servidor.')
      toast.error('Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background gradients for mystical aesthetics */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-md bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl relative z-10 animate-fade-in mx-4">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <div className="p-3 bg-primary/10 rounded-full border border-primary/20 text-primary animate-pulse">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-100">
            Caboclo Pena Branca
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Tenda Espírita • Sistema de Gestão Interna
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <Label htmlFor="login-username" className="text-xs font-semibold text-slate-300">
                Nome de Usuário
              </Label>
              <Input
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-primary"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-xs font-semibold text-slate-300">
                Senha de Acesso
              </Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-primary"
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full font-semibold shadow-md py-5 text-sm" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </Button>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 justify-center">
              <Lock className="h-3 w-3" />
              <span>Acesso restrito para administradores e membros</span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
