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
        <span class="text-sm font-semibold text-gray-900">Properties</span>
      </div>
      <NuxtLink
        to="/properties/create"
        class="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
      >
        Add property
      </NuxtLink>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">
          Properties
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ properties?.length ?? 0 }} propert{{ (properties?.length ?? 0) !== 1 ? 'ies' : 'y' }}
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
          v-else-if="!properties?.length"
          class="px-6 py-10 text-center text-sm text-gray-400"
        >
          No properties yet.
          <NuxtLink
            to="/properties/create"
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Title
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Address
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Type
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Price
                </th>
                <th class="px-6 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="property in properties"
                :key="property._id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 font-medium text-gray-900">
                  {{ property.title }}
                </td>
                <td class="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                  {{ property.address }}
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {{ formatType(property.type) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="statusBadgeClass(property.status)"
                  >
                    {{ formatStatus(property.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 font-medium text-gray-900">
                  {{ formatCurrency(property.price) }}
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    :disabled="deleting === property._id"
                    class="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
                    @click="deleteProperty(property._id, property.title)"
                  >
                    {{ deleting === property._id ? 'Deleting…' : 'Delete' }}
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
interface Property {
  _id: string
  title: string
  address: string
  type: string
  status: 'available' | 'under_agreement' | 'sold'
  price: number
}

const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const { data: properties, pending, refresh } = await useFetch<Property[]>('/api/properties', {
  headers: authHeaders,
})

const deleting = ref<string | null>(null)
const deleteError = ref<string | null>(null)

async function deleteProperty(id: string, title: string) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
  deleting.value = id
  deleteError.value = null
  try {
    await $fetch(`/api/properties/${id}`, { method: 'DELETE', headers: authHeaders })
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    deleteError.value = e.data?.message || 'Failed to delete property.'
  }
  finally {
    deleting.value = null
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
