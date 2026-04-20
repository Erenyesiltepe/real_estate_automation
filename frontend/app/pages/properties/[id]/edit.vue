<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="`/properties/${id}`"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Property
        </NuxtLink>
        <span class="text-gray-300">/</span>
        <span class="text-sm font-semibold text-gray-900">Edit property</span>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-6 py-10">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">
        Edit property
      </h1>

      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <div
          v-if="propertyPending"
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
              for="title"
            >Title</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="address"
            >Address</label>
            <input
              id="address"
              v-model="form.address"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="type"
            >Type</label>
            <select
              id="type"
              v-model="form.type"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="" disabled>
                Select type
              </option>
              <option value="apartment">
                Apartment
              </option>
              <option value="house">
                House
              </option>
              <option value="villa">
                Villa
              </option>
              <option value="office">
                Office
              </option>
              <option value="land">
                Land
              </option>
              <option value="commercial">
                Commercial
              </option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="status"
            >Status</label>
            <select
              id="status"
              v-model="form.status"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="available">
                Available
              </option>
              <option value="under_agreement">
                Under Agreement
              </option>
              <option value="sold">
                Sold
              </option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="price"
            >Price (USD)</label>
            <input
              id="price"
              v-model.number="form.price"
              type="number"
              required
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="listingAgentId"
            >Listing Agent</label>
            <select
              id="listingAgentId"
              v-model="form.listingAgentId"
              required
              :disabled="agentsPending"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option
                value=""
                disabled
              >
                {{ agentsPending ? 'Loading agents…' : 'Select agent' }}
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
              :to="`/properties/${id}`"
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
interface Property {
  _id: string
  title: string
  address: string
  type: string
  status: string
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

const { data: property, pending: propertyPending } = await useFetch<Property>(`/api/properties/${id}`, {
  headers: authHeaders,
})

const { data: agents, pending: agentsPending } = await useFetch<Agent[]>('/api/users', {
  headers: authHeaders,
})

const form = reactive({
  title: '',
  address: '',
  type: '',
  status: '',
  price: null as number | null,
  listingAgentId: '',
})

watch(property, (p) => {
  if (!p) return
  form.title = p.title
  form.address = p.address
  form.type = p.type
  form.status = p.status
  form.price = p.price
  form.listingAgentId = p.listingAgentId
}, { immediate: true })

const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await $fetch(`/api/properties/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: form,
    })
    await navigateTo(`/properties/${id}`)
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
</script>
