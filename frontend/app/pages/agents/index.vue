<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Dashboard
        </NuxtLink>
        <span class="text-gray-300">/</span>
        <span class="text-sm font-semibold text-gray-900">Agents</span>
      </div>
      <NuxtLink
        to="/agents/create"
        class="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
      >
        Add agent
      </NuxtLink>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">
          Agents
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ agents?.length ?? 0 }} active agent{{ (agents?.length ?? 0) !== 1 ? 's' : '' }}
        </p>
      </div>

      <div
        v-if="deleteError"
        class="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
      >
        {{ deleteError }}
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div
          v-if="pending"
          class="px-6 py-10 text-center text-sm text-gray-400"
        >
          Loading…
        </div>
        <div
          v-else-if="!agents?.length"
          class="px-6 py-10 text-center text-sm text-gray-400"
        >
          No agents yet.
          <NuxtLink
            to="/agents/create"
            class="underline hover:text-gray-700"
          >
            Add the first one.
          </NuxtLink>
        </div>
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Phone
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Joined
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="agent in agents"
                :key="agent._id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 text-center font-medium text-gray-900">
                  {{ agent.name }}
                </td>
                <td class="px-6 py-4 text-center text-gray-600">
                  {{ agent.email }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="agent.role === 'admin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'"
                  >
                    {{ agent.role }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center text-gray-500">
                  {{ agent.phone || '—' }}
                </td>
                <td class="px-6 py-4 text-center text-gray-500">
                  {{ formatDate(agent.createdAt) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <NuxtLink
                    :to="`/agents/${agent._id}`"
                    class="text-xs text-gray-500 hover:text-gray-900 transition-colors mr-4"
                  >
                    View
                  </NuxtLink>
                  <button
                    :disabled="deleting === agent._id"
                    class="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
                    @click="deleteAgent(agent._id, agent.name)"
                  >
                    {{ deleting === agent._id ? 'Removing…' : 'Remove' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
interface Agent {
  _id: string
  name: string
  email: string
  role: 'admin' | 'agent'
  phone?: string
  createdAt: string
}

const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const { data: agents, pending, refresh } = await useFetch<Agent[]>('/api/users', {
  headers: authHeaders,
})

const deleting = ref<string | null>(null)
const deleteError = ref<string | null>(null)

async function deleteAgent(id: string, name: string) {
  if (!confirm(`Remove ${name}? This will deactivate their account.`)) return
  deleting.value = id
  deleteError.value = null
  try {
    await $fetch(`/api/users/${id}`, { method: 'DELETE', headers: authHeaders })
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    deleteError.value = e.data?.message || 'Failed to remove agent.'
  }
  finally {
    deleting.value = null
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>
