import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie('auth_token', { sameSite: 'strict' })
  const error = ref<string | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<{ access_token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      token.value = data.access_token
      await navigateTo('/')
    }
    catch (err: unknown) {
      const fetchError = err as { data?: { message?: string } }
      error.value = fetchError.data?.message || 'Invalid credentials'
    }
    finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    navigateTo('/login')
  }

  return { token, error, loading, isAuthenticated, login, logout }
})
