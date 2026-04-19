<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/transactions"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Transactions
        </NuxtLink>
        <span class="text-gray-300">/</span>
        <span class="text-sm font-semibold text-gray-900">New transaction</span>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-6 py-10">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">
          New transaction
        </h1>
        <p class="text-sm text-gray-400 mt-1">
          Transaction starts at the <span class="font-medium text-sky-600">Agreement</span> stage.
        </p>
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <form
          class="space-y-5"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1.5"
              for="propertyId"
            >Property</label>
            <select
              id="propertyId"
              v-model="form.propertyId"
              required
              :disabled="propertiesPending"
              class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option
                value=""
                disabled
              >
                {{ propertiesPending ? 'Loading…' : 'Select property' }}
              </option>
              <option
                v-for="p in properties"
                :key="p._id"
                :value="p._id"
              >
                {{ p.title }}
              </option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1.5"
              for="listingAgentId"
            >Listing Agent</label>
            <select
              id="listingAgentId"
              v-model="form.listingAgentId"
              required
              :disabled="agentsPending"
              class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option
                value=""
                disabled
              >
                {{ agentsPending ? 'Loading…' : 'Select agent' }}
              </option>
              <option
                v-for="agent in agents"
                :key="agent._id"
                :value="agent._id"
              >
                {{ agent.name }}
              </option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1.5"
              for="sellingAgentId"
            >Selling Agent</label>
            <select
              id="sellingAgentId"
              v-model="form.sellingAgentId"
              required
              :disabled="agentsPending"
              class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option
                value=""
                disabled
              >
                {{ agentsPending ? 'Loading…' : 'Select agent' }}
              </option>
              <option
                v-for="agent in agents"
                :key="agent._id"
                :value="agent._id"
              >
                {{ agent.name }}
              </option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1.5"
              for="salePrice"
            >Sale Price</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">$</span>
              <input
                id="salePrice"
                v-model.number="form.salePrice"
                type="number"
                required
                min="1"
                placeholder="500000"
                class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1.5"
              for="totalServiceFee"
            >Total Service Fee</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">$</span>
              <input
                id="totalServiceFee"
                v-model.number="form.totalServiceFee"
                type="number"
                required
                min="1"
                placeholder="25000"
                class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>
          </div>

          <p
            v-if="error"
            class="text-sm text-red-600"
          >
            {{ error }}
          </p>

          <div class="flex items-center gap-3 pt-1">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Creating…' : 'Create transaction' }}
            </button>
            <NuxtLink
              to="/transactions"
              class="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
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
}

interface Property {
  _id: string
  title: string
}

interface CreatedTransaction {
  _id: string
}

const auth = useAuthStore()
const authHeaders = { Authorization: `Bearer ${auth.token}` }

const { data: properties, pending: propertiesPending } = await useFetch<Property[]>('/api/properties', {
  headers: authHeaders,
})
const { data: agents, pending: agentsPending } = await useFetch<Agent[]>('/api/users', {
  headers: authHeaders,
})

const form = reactive({
  propertyId: '',
  listingAgentId: '',
  sellingAgentId: '',
  salePrice: null as number | null,
  totalServiceFee: null as number | null,
})

const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const tx = await $fetch<CreatedTransaction>('/api/transactions', {
      method: 'POST',
      headers: authHeaders,
      body: form,
    })
    await navigateTo(`/transactions/${tx._id}`)
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
