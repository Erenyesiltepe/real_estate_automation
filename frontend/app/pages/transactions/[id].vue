<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Stage-colored hero -->
    <div
      class="px-6 pt-5 pb-14 transition-colors duration-500"
      :class="config.heroBg"
    >
      <!-- Top bar -->
      <div class="max-w-3xl mx-auto flex items-center justify-between mb-8">
        <NuxtLink
          to="/transactions"
          class="text-sm font-medium text-white/70 hover:text-white transition-colors"
        >
          ← Transactions
        </NuxtLink>
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-black/20 text-white tracking-wide uppercase">
          {{ formatStage(transaction?.stage ?? '') }}
        </span>
      </div>

      <!-- Property + financials -->
      <div
        v-if="transaction"
        class="max-w-3xl mx-auto"
      >
        <h1 class="text-2xl font-bold text-white">
          {{ transaction.propertyId.title }}
        </h1>
        <p class="text-sm text-white/60 mt-1">
          {{ transaction.propertyId.address }}
        </p>

        <div class="flex gap-10 mt-6">
          <div>
            <div class="text-xs text-white/50 uppercase tracking-wide mb-1">
              Sale Price
            </div>
            <div class="text-2xl font-bold text-white">
              {{ formatCurrency(transaction.salePrice) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-white/50 uppercase tracking-wide mb-1">
              Service Fee
            </div>
            <div class="text-2xl font-bold text-white">
              {{ formatCurrency(transaction.totalServiceFee) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-white/50 uppercase tracking-wide mb-1">
              Last Updated
            </div>
            <div class="text-base font-semibold text-white">
              {{ formatDate(transaction.stageUpdatedAt) }}
            </div>
          </div>
        </div>

        <!-- Step-indicator progress bar -->
        <div class="mt-10 relative">
          <!-- Track background line -->
          <div
            class="absolute h-0.5 bg-white/20 top-5"
            style="left: 12.5%; right: 12.5%;"
          />
          <!-- Track fill line -->
          <div
            class="absolute h-0.5 bg-white top-5 transition-all duration-700"
            :style="{
              left: '12.5%',
              width: `${(currentStageIdx / (STAGES.length - 1)) * 75}%`,
            }"
          />
          <!-- Step nodes -->
          <div class="relative flex justify-between">
            <div
              v-for="(step, idx) in STAGES"
              :key="step.value"
              class="flex flex-col items-center gap-2 w-1/4"
            >
              <!-- Circle -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-500"
                :class="[
                  idx < currentStageIdx ? 'bg-white border-white text-gray-700' : '',
                  idx === currentStageIdx ? 'bg-white/20 border-white text-white ring-4 ring-white/20' : '',
                  idx > currentStageIdx ? 'bg-transparent border-white/30 text-white/30' : '',
                ]"
              >
                <!-- Checkmark for completed stages -->
                <svg
                  v-if="idx < currentStageIdx"
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <!-- Number for current/future -->
                <span
                  v-else
                  class="text-xs font-bold leading-none"
                >{{ idx + 1 }}</span>
              </div>
              <!-- Label -->
              <div
                class="text-xs font-medium text-center transition-colors leading-tight"
                :class="idx === currentStageIdx ? 'text-white' : idx < currentStageIdx ? 'text-white/60' : 'text-white/30'"
              >
                {{ step.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <main
      v-if="transaction"
      class="max-w-3xl mx-auto px-6 -mt-4 pb-12 space-y-4"
    >

      <!-- Advance stage / completed banner -->
      <div
        v-if="nextStage"
        class="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex items-center justify-between"
      >
        <div>
          <p class="text-sm font-semibold text-gray-900">
            Ready to advance?
          </p>
          <p class="text-xs text-gray-500 mt-0.5">
            Next stage: <span class="font-medium">{{ formatStage(nextStage) }}</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <p
            v-if="stageError"
            class="text-sm text-red-600"
          >
            {{ stageError }}
          </p>
          <button
            :disabled="advancing"
            class="px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="config.button"
            @click="advanceStage"
          >
            {{ advancing ? 'Updating…' : `Advance to ${formatStage(nextStage)} →` }}
          </button>
        </div>
      </div>

      <div
        v-else
        class="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex items-center gap-3"
      >
        <div
          class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          :class="config.iconBg"
        >
          <svg
            class="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-gray-900">
            Transaction completed
          </p>
          <p class="text-xs text-gray-500 mt-0.5">
            Commission breakdown has been calculated.
          </p>
        </div>
      </div>

      <!-- Agents + details -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Listing Agent
          </div>
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              :class="config.iconBg"
            >
              {{ transaction.listingAgentId.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="text-sm font-semibold text-gray-900">
                {{ transaction.listingAgentId.name }}
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ transaction.listingAgentId.email }}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Selling Agent
          </div>
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              :class="config.iconBg"
            >
              {{ transaction.sellingAgentId.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="text-sm font-semibold text-gray-900">
                {{ transaction.sellingAgentId.name }}
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ transaction.sellingAgentId.email }}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Property Type
          </div>
          <div class="text-sm font-semibold text-gray-900 capitalize">
            {{ transaction.propertyId.type ?? '—' }}
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Created
          </div>
          <div class="text-sm font-semibold text-gray-900">
            {{ formatDate(transaction.createdAt) }}
          </div>
        </div>
      </div>

      <!-- Commission breakdown -->
      <div
        v-if="transaction.stage === 'completed' && commission"
        class="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      >
        <div
          class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
          :class="config.commissionHeader"
        >
          <h2 class="text-sm font-semibold text-white">
            Commission Breakdown
          </h2>
          <span class="text-xs text-white/70">
            {{ commission.isSameAgent ? 'Single agent' : 'Split between agents' }}
          </span>
        </div>
        <div class="divide-y divide-gray-50">
          <!-- Agency row -->
          <div class="px-6 py-4">
            <div class="flex items-center justify-between mb-2">
              <div>
                <div class="text-sm font-medium text-gray-900">
                  Agency
                </div>
                <div class="text-xs text-gray-400">
                  50% of service fee
                </div>
              </div>
              <div class="text-base font-bold text-gray-900">
                {{ formatCurrency(commission.agencyAmount) }}
              </div>
            </div>
            <div class="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="config.commissionBar"
                style="width: 50%"
              />
            </div>
          </div>
          <!-- Listing agent row -->
          <div class="px-6 py-4">
            <div class="flex items-center justify-between mb-2">
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {{ transaction.listingAgentId.name }}
                </div>
                <div class="text-xs text-gray-400">
                  Listing agent
                </div>
              </div>
              <div class="text-base font-bold text-gray-900">
                {{ formatCurrency(commission.listingAgentAmount) }}
              </div>
            </div>
            <div class="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="config.commissionBar"
                :style="{ width: `${(commission.listingAgentAmount / transaction.totalServiceFee) * 100}%` }"
              />
            </div>
          </div>
          <!-- Selling agent row -->
          <div class="px-6 py-4">
            <div class="flex items-center justify-between mb-2">
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {{ transaction.sellingAgentId.name }}
                </div>
                <div class="text-xs text-gray-400">
                  Selling agent
                </div>
              </div>
              <div class="text-base font-bold text-gray-900">
                {{ formatCurrency(commission.sellingAgentAmount) }}
              </div>
            </div>
            <div class="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="config.commissionBar"
                :style="{ width: `${(commission.sellingAgentAmount / transaction.totalServiceFee) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <div
      v-else
      class="max-w-3xl mx-auto px-6 py-16 text-center text-sm text-gray-400"
    >
      Transaction not found.
    </div>
  </div>
</template>

<script setup lang="ts">
interface PopulatedAgent {
  _id: string
  name: string
  email: string
}

interface PopulatedProperty {
  _id: string
  title: string
  address: string
  type?: string
}

type Stage = 'agreement' | 'earnest_money' | 'title_deed' | 'completed'

interface TransactionDetail {
  _id: string
  propertyId: PopulatedProperty
  listingAgentId: PopulatedAgent
  sellingAgentId: PopulatedAgent
  salePrice: number
  totalServiceFee: number
  stage: Stage
  stageUpdatedAt: string
  createdAt: string
}

interface Commission {
  agencyAmount: number
  listingAgentAmount: number
  sellingAgentAmount: number
  isSameAgent: boolean
}

const STAGES = [
  { value: 'agreement', label: 'Agreement' },
  { value: 'earnest_money', label: 'Earnest Money' },
  { value: 'title_deed', label: 'Title Deed' },
  { value: 'completed', label: 'Completed' },
] as const

const STAGE_ORDER: Stage[] = ['agreement', 'earnest_money', 'title_deed', 'completed']

// Full class strings required so Tailwind JIT includes them
const STAGE_CONFIG: Record<string, { heroBg: string, button: string, iconBg: string, commissionHeader: string, commissionBar: string }> = {
  agreement: {
    heroBg: 'bg-sky-600',
    button: 'bg-sky-500 hover:bg-sky-600',
    iconBg: 'bg-sky-500',
    commissionHeader: 'bg-sky-600',
    commissionBar: 'bg-sky-400',
  },
  earnest_money: {
    heroBg: 'bg-amber-600',
    button: 'bg-amber-500 hover:bg-amber-600',
    iconBg: 'bg-amber-500',
    commissionHeader: 'bg-amber-600',
    commissionBar: 'bg-amber-400',
  },
  title_deed: {
    heroBg: 'bg-violet-600',
    button: 'bg-violet-500 hover:bg-violet-600',
    iconBg: 'bg-violet-500',
    commissionHeader: 'bg-violet-600',
    commissionBar: 'bg-violet-400',
  },
  completed: {
    heroBg: 'bg-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    iconBg: 'bg-emerald-600',
    commissionHeader: 'bg-emerald-700',
    commissionBar: 'bg-emerald-500',
  },
}

const route = useRoute()
const id = route.params.id as string
const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const { data, refresh } = await useAsyncData(`transaction-${id}`, async () => {
  const transaction = await $fetch<TransactionDetail>(`/api/transactions/${id}`, {
    headers: authHeaders,
  })
  let commission: Commission | null = null
  if (transaction.stage === 'completed') {
    try {
      commission = await $fetch<Commission>(`/api/commissions/transaction/${id}`, {
        headers: authHeaders,
      })
    }
    catch {
      // commission not yet available
    }
  }
  return { transaction, commission }
})

const transaction = computed(() => data.value?.transaction ?? null)
const commission = computed(() => data.value?.commission ?? null)

const currentStageIdx = computed(() =>
  transaction.value ? STAGE_ORDER.indexOf(transaction.value.stage) : 0,
)

const config = computed(() =>
  STAGE_CONFIG[transaction.value?.stage ?? 'agreement'],
)

const nextStage = computed<Stage | null>(() => {
  if (!transaction.value) return null
  const idx = STAGE_ORDER.indexOf(transaction.value.stage)
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null
})

const advancing = ref(false)
const stageError = ref<string | null>(null)

async function advanceStage() {
  if (!nextStage.value) return
  advancing.value = true
  stageError.value = null
  try {
    await $fetch(`/api/transactions/${id}/stage`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { stage: nextStage.value },
    })
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    stageError.value = e.data?.message || 'Failed to advance stage.'
  }
  finally {
    advancing.value = false
  }
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
