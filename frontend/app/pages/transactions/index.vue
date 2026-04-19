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
        <span class="text-sm font-semibold text-gray-900">Transactions</span>
      </div>
      <NuxtLink
        to="/transactions/create"
        class="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
      >
        New transaction
      </NuxtLink>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">
            Transactions
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ filtered.length }} transaction{{ filtered.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Stage filter tabs -->
        <div class="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs font-medium">
          <button
            v-for="f in filters"
            :key="f.value"
            class="px-3 py-1.5 rounded-lg transition-all"
            :class="tabClass(f.value)"
            @click="activeFilter = f.value"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div
          v-if="pending"
          class="px-6 py-10 text-center text-sm text-gray-400"
        >
          Loading…
        </div>
        <div
          v-else-if="!filtered.length"
          class="px-6 py-10 text-center text-sm text-gray-400"
        >
          No transactions{{ activeFilter !== 'all' ? ' in this stage' : '' }}.
        </div>
        <div
          v-else
          class="divide-y divide-gray-50"
        >
          <NuxtLink
            v-for="tx in filtered"
            :key="tx._id"
            :to="`/transactions/${tx._id}`"
            class="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 transition-colors group"
          >
            <!-- Stage accent bar -->
            <div
              class="w-1 self-stretch rounded-full flex-shrink-0"
              :class="stageAccent(tx.stage)"
            />

            <!-- Main content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1.5">
                <span
                  class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="stageBadge(tx.stage)"
                >
                  {{ formatStage(tx.stage) }}
                </span>
                <span class="font-mono text-xs text-gray-300">{{ tx._id.slice(-8) }}</span>
              </div>
              <div class="text-lg font-bold text-gray-900">
                {{ formatCurrency(tx.salePrice) }}
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                Fee: {{ formatCurrency(tx.totalServiceFee) }}
              </div>
            </div>

            <!-- Mini progress segments -->
            <div class="hidden sm:flex items-center gap-1 flex-shrink-0">
              <div
                v-for="(step, idx) in STAGE_ORDER"
                :key="step"
                class="h-1.5 w-7 rounded-sm transition-colors"
                :class="idx <= stageIndex(tx.stage) ? stageAccent(tx.stage) : 'bg-gray-200'"
              />
            </div>

            <!-- Date + arrow -->
            <div class="text-right flex-shrink-0">
              <div class="text-xs text-gray-400">
                {{ formatDate(tx.createdAt) }}
              </div>
              <div class="text-xs text-gray-300 group-hover:text-gray-500 transition-colors mt-1">
                View →
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
type Stage = 'agreement' | 'earnest_money' | 'title_deed' | 'completed'

interface Transaction {
  _id: string
  salePrice: number
  totalServiceFee: number
  stage: Stage
  createdAt: string
}

const STAGE_ORDER: Stage[] = ['agreement', 'earnest_money', 'title_deed', 'completed']

const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const { data: transactions, pending } = await useFetch<Transaction[]>('/api/transactions', {
  headers: authHeaders,
})

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Agreement', value: 'agreement' },
  { label: 'Earnest Money', value: 'earnest_money' },
  { label: 'Title Deed', value: 'title_deed' },
  { label: 'Completed', value: 'completed' },
]

const activeFilter = ref('all')

const filtered = computed(() => {
  const list = transactions.value ?? []
  if (activeFilter.value === 'all') return list
  return list.filter(tx => tx.stage === activeFilter.value)
})

// Full class strings for Tailwind JIT
const stageAccents: Record<string, string> = {
  agreement: 'bg-sky-400',
  earnest_money: 'bg-amber-400',
  title_deed: 'bg-violet-400',
  completed: 'bg-emerald-500',
}

const stageBadges: Record<string, string> = {
  agreement: 'bg-sky-50 text-sky-700',
  earnest_money: 'bg-amber-50 text-amber-700',
  title_deed: 'bg-violet-50 text-violet-700',
  completed: 'bg-emerald-50 text-emerald-700',
}

const stageTabActives: Record<string, string> = {
  all: 'bg-white text-gray-900 shadow-sm',
  agreement: 'bg-sky-500 text-white shadow-sm',
  earnest_money: 'bg-amber-500 text-white shadow-sm',
  title_deed: 'bg-violet-500 text-white shadow-sm',
  completed: 'bg-emerald-600 text-white shadow-sm',
}

function stageAccent(stage: string) {
  return stageAccents[stage] ?? 'bg-gray-300'
}

function stageBadge(stage: string) {
  return stageBadges[stage] ?? 'bg-gray-100 text-gray-600'
}

function tabClass(filterValue: string) {
  if (activeFilter.value !== filterValue) return 'text-gray-500 hover:text-gray-700'
  return stageTabActives[filterValue] ?? 'bg-white text-gray-900 shadow-sm'
}

function stageIndex(stage: string) {
  return STAGE_ORDER.indexOf(stage as Stage)
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
</script>
