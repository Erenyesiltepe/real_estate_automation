<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/agents"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Agents
        </NuxtLink>
        <span class="text-gray-300">/</span>
        <span class="text-sm font-semibold text-gray-900">Add agent</span>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-6 py-10">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">
        Add agent
      </h1>

      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="name"
            >Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              autocomplete="name"
              placeholder="Jane Smith"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="email"
            >Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              placeholder="jane@example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="password"
            >Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              autocomplete="new-password"
              placeholder="Min. 6 characters"
              minlength="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="role"
            >Role</label>
            <select
              id="role"
              v-model="form.role"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="agent">
                Agent
              </option>
              <option value="admin">
                Admin
              </option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="phone"
            >Phone <span class="text-gray-400 font-normal">(optional)</span></label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              autocomplete="tel"
              placeholder="+1 555 000 0000"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
          </div>

          <p
            v-if="error"
            class="text-sm text-red-600"
          >
            {{ error }}
          </p>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Creating…' : 'Create agent' }}
            </button>
            <NuxtLink
              to="/agents"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </NuxtLink>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'agent' as 'agent' | 'admin',
  phone: '',
})

const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const body: Record<string, string> = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    }
    if (form.phone.trim()) body.phone = form.phone.trim()

    await $fetch('/api/users', {
      method: 'POST',
      headers: authHeaders,
      body,
    })
    await navigateTo('/agents')
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string | string[] } }
    const msg = e.data?.message
    error.value = Array.isArray(msg) ? msg[0] : (msg || 'Something went wrong.')
  }
  finally {
    loading.value = false
  }
}
</script>
