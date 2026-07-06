// Helper central de acesso à API.
// Injeta o token JWT, trata 401 (sessão expirada/inválida) e centraliza a base URL.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const TOKEN_KEY = 'white_feather_token'
const USER_KEY = 'white_feather_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

// Conveniência de UI. NÃO é controle de segurança — o objeto `user` do
// localStorage é editável; a proteção real é feita no backend.
export function isAdmin() {
  return getUser()?.role === 'admin'
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('auth-change'))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('auth-change'))
}

/**
 * fetch autenticado. `path` deve começar com '/' (ex.: '/membros').
 * Em caso de 401, limpa a sessão e redireciona para /login.
 */
export async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }

  // Só define Content-Type quando há corpo, para não quebrar GET/DELETE
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (response.status === 401) {
    clearSession()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  return response
}
