<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <span class="text-base font-semibold text-gray-900">Estate Agency</span>
      <button
        class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        @click="auth.logout()"
      >
        Sign out
      </button>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">
          Dashboard
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Overview of your agency
        </p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white rounded-2xl border border-gray-200 p-5"
        >
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {{ stat.label }}
          </p>
          <p class="text-3xl font-semibold text-gray-900 mt-2">
            {{ stat.value }}
          </p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900">
            Recent Transactions
          </h2>
          <NuxtLink
            to="/transactions"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            View all →
          </NuxtLink>
        </div>

        <div
          v-if="pending"
          class="px-6 py-10 text-center text-sm text-gray-400"
        >
          Loading…
        </div>
        <div
          v-else-if="!recentTransactions.length"
          class="px-6 py-10 text-center text-sm text-gray-400"
        >
          No transactions yet.
        </div>
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left border-b border-gray-100">
                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  ID
                </th>
                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Sale Price
                </th>
                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Service Fee
                </th>
                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Stage
                </th>
                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="tx in recentTransactions"
                :key="tx._id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 font-mono text-xs text-gray-400">
                  …{{ tx._id.slice(-8) }}
                </td>
                <td class="px-6 py-4 font-medium text-gray-900">
                  {{ formatCurrency(tx.salePrice) }}
                </td>
                <td class="px-6 py-4 text-gray-600">
                  {{ formatCurrency(tx.totalServiceFee) }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="stageBadgeClass(tx.stage)"
                  >
                    {{ formatStage(tx.stage) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-500">
                  {{ formatDate(tx.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NuxtLink
          v-for="link in quickLinks"
          :key="link.to"
          :to="link.to"
          class="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors group"
        >
          <p class="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
            {{ link.label }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            {{ link.description }}
          </p>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
interface User {
  _id: string
  name: string
  isActive: boolean
}

interface Property {
  _id: string
  status: 'available' | 'under_agreement' | 'sold'
}

interface Transaction {
  _id: string
  salePrice: number
  totalServiceFee: number
  stage: 'agreement' | 'earnest_money' | 'title_deed' | 'completed'
  createdAt: string
}

const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const { data: users } = await useFetch<User[]>('/api/users', { headers: authHeaders })
const { data: properties } = await useFetch<Property[]>('/api/properties', { headers: authHeaders })
const { data: transactions, pending } = await useFetch<Transaction[]>('/api/transactions', { headers: authHeaders })

const stats = computed(() => [
  {
    label: 'Active Agents',
    value: users.value?.filter(u => u.isActive).length ?? 0,
  },
  {
    label: 'Available Properties',
    value: properties.value?.filter(p => p.status === 'available').length ?? 0,
  },
  {
    label: 'Transactions',
    value: transactions.value?.length ?? 0,
  },
  {
    label: 'Completed Transactions',
    value: transactions.value?.filter(t => t.stage === 'completed').length ?? 0,
  },
])

const recentTransactions = computed(() =>
  [...(transactions.value ?? [])].reverse().slice(0, 8),
)

const stageColors: Record<string, string> = {
  agreement: 'bg-sky-50 text-sky-700',
  earnest_money: 'bg-amber-50 text-amber-700',
  title_deed: 'bg-violet-50 text-violet-700',
  completed: 'bg-green-50 text-green-700',
}

function stageBadgeClass(stage: string) {
  return stageColors[stage] ?? 'bg-gray-100 text-gray-600'
}

function formatStage(stage: string) {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const quickLinks = [
  { to: '/agents', label: 'Agents', description: 'Manage your agency agents' },
  { to: '/properties', label: 'Properties', description: 'Browse and manage listings' },
  { to: '/transactions', label: 'Transactions', description: 'Track all transactions and stages' },
]
</script>
