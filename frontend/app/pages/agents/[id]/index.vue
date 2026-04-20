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
          to="/agents"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Agents
        </NuxtLink>
        <span class="text-gray-300">/</span>
        <span class="text-sm font-semibold text-gray-900">{{ agent?.name }}</span>
      </div>
      <div
        v-if="agent"
        class="flex items-center gap-3"
      >
        <NuxtLink
          :to="`/agents/${id}/edit`"
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
      v-if="agent"
      class="max-w-5xl mx-auto px-6 py-8 space-y-6"
    >
      <div
        v-if="deleteError"
        class="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
      >
        {{ deleteError }}
      </div>

      <!-- Agent profile -->
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
          {{ agent.name.charAt(0).toUpperCase() }}
        </div>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">
            {{ agent.name }}
          </h1>
          <div class="flex items-center gap-3 mt-1 flex-wrap">
            <span class="text-sm text-gray-500">{{ agent.email }}</span>
            <span
              class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
              :class="agent.role === 'admin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'"
            >
              {{ agent.role }}
            </span>
            <span
              v-if="agent.phone"
              class="text-sm text-gray-500"
            >{{ agent.phone }}</span>
          </div>
        </div>
      </div>

      <!-- Summary cards 2×2 -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Total Transactions
          </div>
          <div class="text-2xl font-bold text-gray-900">
            {{ totalTransactions }}
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Total Sale Volume
          </div>
          <div class="text-2xl font-bold text-gray-900">
            {{ formatCurrency(totalVolume) }}
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Commission Earned
          </div>
          <div class="text-2xl font-bold text-gray-900">
            {{ formatCurrency(totalCommission) }}
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Role Split
          </div>
          <div class="text-sm font-semibold text-gray-900">
            {{ listingCount }} as listing · {{ sellingCount }} as selling
          </div>
        </div>
      </div>

      <!-- Transaction list -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Transactions
          </h2>
          <div class="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs font-medium">
            <button
              v-for="f in filters"
              :key="f.value"
              class="px-3 py-1.5 rounded-lg transition-all"
              :class="tabClass(f.value)"
              @click="setFilter(f.value)"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div
            v-if="!paginated.length"
            class="px-6 py-10 text-center text-sm text-gray-400"
          >
            No transactions{{ activeFilter !== 'all' ? ' in this stage' : '' }}.
          </div>
          <div
            v-else
            class="divide-y divide-gray-50"
          >
            <NuxtLink
              v-for="tx in paginated"
              :key="tx._id"
              :to="`/transactions/${tx._id}`"
              class="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 transition-colors group"
            >
              <div
                class="w-1 self-stretch rounded-full flex-shrink-0"
                :class="stageAccent(tx.stage)"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5">
                  <span
                    class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="stageBadge(tx.stage)"
                  >
                    {{ formatStage(tx.stage) }}
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {{ tx.listingAgentId.toString() === id ? 'Listing' : 'Selling' }}
                  </span>
                </div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ tx.propertyId.title }}
                </div>
                <div class="text-xs text-gray-400 mt-0.5">
                  {{ formatCurrency(tx.salePrice) }} · Fee: {{ formatCurrency(tx.totalServiceFee) }}
                </div>
              </div>
              <div class="hidden sm:flex items-center gap-1 flex-shrink-0">
                <div
                  v-for="(step, idx) in STAGE_ORDER"
                  :key="step"
                  class="h-1.5 w-7 rounded-sm transition-colors"
                  :class="idx <= stageIndex(tx.stage) ? stageAccent(tx.stage) : 'bg-gray-200'"
                />
              </div>
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

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-between mt-4"
        >
          <button
            :disabled="currentPage === 1"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="currentPage--"
          >
            ← Previous
          </button>
          <span class="text-sm text-gray-500">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            :disabled="currentPage === totalPages"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="currentPage++"
          >
            Next →
          </button>
        </div>
      </div>
    </main>

    <div
      v-else
      class="max-w-5xl mx-auto px-6 py-16 text-center text-sm text-gray-400"
    >
      Agent not found.
    </div>
  </div>
</template>

<script setup lang="ts">
type Stage = 'agreement' | 'earnest_money' | 'title_deed' | 'completed'

interface AgentProfile {
  _id: string
  name: string
  email: string
  role: 'admin' | 'agent'
  phone?: string
  createdAt: string
}

interface AgentTransaction {
  _id: string
  propertyId: { _id: string; title: string; address: string }
  listingAgentId: string
  sellingAgentId: string
  salePrice: number
  totalServiceFee: number
  stage: Stage
  createdAt: string
}

interface AgentCommission {
  _id: string
  listingAgentId: string
  sellingAgentId: string
  listingAgentAmount: number
  sellingAgentAmount: number
  isSameAgent: boolean
}

const STAGE_ORDER: Stage[] = ['agreement', 'earnest_money', 'title_deed', 'completed']

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

const PAGE_SIZE = 10

const route = useRoute()
const id = route.params.id as string
const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const { data } = await useAsyncData(`agent-${id}`, async () => {
  const [agent, transactions, commissions] = await Promise.all([
    $fetch<AgentProfile>(`/api/users/${id}`, { headers: authHeaders }),
    $fetch<AgentTransaction[]>(`/api/transactions/agent/${id}`, { headers: authHeaders }),
    $fetch<AgentCommission[]>(`/api/commissions/agent/${id}`, { headers: authHeaders }).catch(() => [] as AgentCommission[]),
  ])
  return { agent, transactions, commissions }
})

const agent = computed(() => data.value?.agent ?? null)
const transactions = computed(() => data.value?.transactions ?? [])
const commissions = computed(() => data.value?.commissions ?? [])

const totalTransactions = computed(() => transactions.value.length)

const totalVolume = computed(() =>
  transactions.value.reduce((sum, tx) => sum + tx.salePrice, 0),
)

const totalCommission = computed(() =>
  commissions.value.reduce((sum, c) => {
    let earned = 0
    if (c.listingAgentId.toString() === id) earned += c.listingAgentAmount
    if (c.sellingAgentId.toString() === id) earned += c.sellingAgentAmount
    return sum + earned
  }, 0),
)

const listingCount = computed(() =>
  transactions.value.filter(tx => tx.listingAgentId.toString() === id).length,
)

const sellingCount = computed(() =>
  transactions.value.filter(tx => tx.sellingAgentId.toString() === id).length,
)

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Agreement', value: 'agreement' },
  { label: 'Earnest Money', value: 'earnest_money' },
  { label: 'Title Deed', value: 'title_deed' },
  { label: 'Completed', value: 'completed' },
]

const activeFilter = ref('all')
const currentPage = ref(1)

function setFilter(value: string) {
  activeFilter.value = value
  currentPage.value = 1
}

const filtered = computed(() => {
  if (activeFilter.value === 'all') return transactions.value
  return transactions.value.filter(tx => tx.stage === activeFilter.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

function stageAccent(stage: string) { return stageAccents[stage] ?? 'bg-gray-300' }
function stageBadge(stage: string) { return stageBadges[stage] ?? 'bg-gray-100 text-gray-600' }

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

const deleting = ref(false)
const deleteError = ref<string | null>(null)

async function handleDelete() {
  if (!confirm(`Delete "${agent.value?.name}"? This cannot be undone.`)) return
  deleting.value = true
  deleteError.value = null
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
