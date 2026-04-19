<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-semibold text-gray-900 mb-4">
        Dashboard
      </h1>
      <button
        class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        @click="auth.logout()"
      >
        Sign out
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
</script>
