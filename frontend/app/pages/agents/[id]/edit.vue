<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="`/agents/${id}`"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Agent
        </NuxtLink>
        <span class="text-gray-300">/</span>
        <span class="text-sm font-semibold text-gray-900">Edit agent</span>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-6 py-10">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">
        Edit agent
      </h1>

      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <div
          v-if="agentPending"
          class="py-6 text-center text-sm text-gray-400"
        >
          Loading…
        </div>
        <form
          v-else
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
            >Phone</label>
            <input
              id="phone"
              v-model="form.phone"
              type="text"
              placeholder="+905551234567"
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
              {{ loading ? 'Saving…' : 'Save changes' }}
            </button>
            <NuxtLink
              :to="`/agents/${id}`"
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
interface Agent {
  _id: string
  name: string
  email: string
  role: string
  phone?: string
}

const route = useRoute()
const id = route.params.id as string
const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const { data: agent, pending: agentPending } = await useFetch<Agent>(`/api/users/${id}`, {
  headers: authHeaders,
})

const form = reactive({
  name: '',
  email: '',
  role: '',
  phone: '',
})

watch(agent, (a) => {
  if (!a) return
  form.name = a.name
  form.email = a.email
  form.role = a.role
  form.phone = a.phone ?? ''
}, { immediate: true })

const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await $fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        name: form.name,
        email: form.email,
        role: form.role,
        ...(form.phone ? { phone: form.phone } : {}),
      },
    })
    await navigateTo(`/agents/${id}`)
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string | string[] } }
    const msg = e.data?.message
    error.value = Array.isArray(msg) ? (msg[0] ?? 'Something went wrong.') : (msg || 'Something went wrong.')
  }
  finally {
    loading.value = false
  }
}

const deleting = ref(false)
const deleteError = ref<string | null>(null)

async function handleDelete() {
  if (!confirm(`Delete "${agent.value?.name}"? This cannot be undone.`)) return
  deleting.value = true
  try {
    await $fetch(`/api/users/${id}`, { method: 'DELETE', headers: authHeaders })
    await navigateTo('/agents')
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    deleteError.value = e.data?.message || 'Failed to delete agent.'
  }
  finally {
    deleting.value = false
  }
}
</script>
