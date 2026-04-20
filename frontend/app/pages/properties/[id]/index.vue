<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Dashboard
        </NuxtLink>
        <span class="text-gray-300">/</span>
        <NuxtLink
          to="/properties"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Properties
        </NuxtLink>
        <span class="text-gray-300">/</span>
        <span class="text-sm font-semibold text-gray-900">{{ property?.title }}</span>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink
          v-if="property"
          :to="`/properties/${id}/edit`"
          class="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Edit
        </NuxtLink>
        <button
          :disabled="deleting"
          class="text-sm text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
          @click="handleDelete"
        >
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>
      </div>
    </header>

    <main
      v-if="property"
      class="max-w-2xl mx-auto px-6 py-8 space-y-6"
    >
      <div
        v-if="deleteError"
        class="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
      >
        {{ deleteError }}
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50">
        <div class="px-6 py-4 flex items-center justify-between">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Title</span>
          <span class="text-sm font-medium text-gray-900">{{ property.title }}</span>
        </div>
        <div class="px-6 py-4 flex items-center justify-between">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Address</span>
          <span class="text-sm text-gray-700">{{ property.address }}</span>
        </div>
        <div class="px-6 py-4 flex items-center justify-between">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Type</span>
          <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {{ formatType(property.type) }}
          </span>
        </div>
        <div class="px-6 py-4 flex items-center justify-between">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</span>
          <span
            class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
            :class="statusBadgeClass(property.status)"
          >
            {{ formatStatus(property.status) }}
          </span>
        </div>
        <div class="px-6 py-4 flex items-center justify-between">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Price</span>
          <span class="text-sm font-medium text-gray-900">{{ formatCurrency(property.price) }}</span>
        </div>
        <div class="px-6 py-4 flex items-center justify-between">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Listing Agent</span>
          <span class="text-sm text-gray-700">{{ agentName }}</span>
        </div>
      </div>
    </main>

    <div
      v-else
      class="max-w-2xl mx-auto px-6 py-16 text-center text-sm text-gray-400"
    >
      Property not found.
    </div>
  </div>
</template>

<script setup lang="ts">
interface Property {
  _id: string
  title: string
  address: string
  type: string
  status: 'available' | 'under_agreement' | 'sold'
  price: number
  listingAgentId: string
}

interface Agent {
  _id: string
  name: string
}

const route = useRoute()
const id = route.params.id as string
const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const { data } = await useAsyncData(`property-${id}`, async () => {
  const [property, users] = await Promise.all([
    $fetch<Property>(`/api/properties/${id}`, { headers: authHeaders }),
    $fetch<Agent[]>('/api/users', { headers: authHeaders }),
  ])
  return { property, users }
})

const property = computed(() => data.value?.property ?? null)

const agentName = computed(() => {
  const users = data.value?.users ?? []
  const agent = users.find(u => u._id === property.value?.listingAgentId)
  return agent?.name ?? '—'
})

const deleting = ref(false)
const deleteError = ref<string | null>(null)

async function handleDelete() {
  if (!confirm(`Delete "${property.value?.title}"? This cannot be undone.`)) return
  deleting.value = true
  deleteError.value = null
  try {
    await $fetch(`/api/properties/${id}`, { method: 'DELETE', headers: authHeaders })
    await navigateTo('/properties')
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    deleteError.value = e.data?.message || 'Failed to delete property.'
  }
  finally {
    deleting.value = false
  }
}

const statusColors: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  under_agreement: 'bg-amber-50 text-amber-700',
  sold: 'bg-gray-100 text-gray-600',
}

function statusBadgeClass(status: string) {
  return statusColors[status] ?? 'bg-gray-100 text-gray-600'
}

function formatType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}
</script>
