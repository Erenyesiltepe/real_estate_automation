<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">
        Sign in
      </h1>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
        </div>

        <p v-if="auth.error" class="text-sm text-red-600">
          {{ auth.error }}
        </p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ auth.loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const auth = useAuthStore()
const email = ref('')
const password = ref('')

function handleSubmit() {
  auth.login(email.value, password.value)
}
</script>
