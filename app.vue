<script setup lang="ts">
const route = useRoute()

const navClass = (path: string): string => {
  const active = route.path === path
  return active
    ? 'inline-flex min-h-11 w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md sm:w-auto'
    : 'inline-flex min-h-11 w-full items-center justify-center rounded-full bg-emerald-100 px-4 py-2 text-emerald-900 hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-sm sm:w-auto'
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
    <header class="card-soft mb-5 overflow-hidden p-4 sm:mb-6 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-emerald-800">🌿 Gartenplaner</h1>
        <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          Fruchtfolge im Blick
        </span>
      </div>
      <nav class="mt-4 grid grid-cols-1 gap-2 text-sm sm:flex sm:flex-wrap">
        <NuxtLink :class="navClass('/')" to="/">Übersicht</NuxtLink>
        <NuxtLink :class="navClass('/beds')" to="/beds">Beete</NuxtLink>
        <NuxtLink :class="navClass('/settings')" to="/settings">Einstellungen</NuxtLink>
      </nav>
    </header>

    <NuxtPage />
  </div>
</template>
