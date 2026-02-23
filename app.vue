<script setup lang="ts">
const route = useRoute()

const navClass = (path: string): string => {
  const active = route.path === path
  return active
    ? 'rounded-full bg-emerald-600 px-3 py-1.5 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md'
    : 'rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-900 hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-sm'
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
    <header class="card-soft mb-6 overflow-hidden p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-emerald-800">🌿 Gartenplaner</h1>
        <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          Fruchtfolge im Blick
        </span>
      </div>
      <nav class="mt-4 flex flex-wrap gap-2 text-sm">
        <NuxtLink :class="navClass('/')" to="/">Übersicht</NuxtLink>
        <NuxtLink :class="navClass('/beds')" to="/beds">Beete</NuxtLink>
        <NuxtLink :class="navClass('/settings')" to="/settings">Einstellungen</NuxtLink>
      </nav>
    </header>

    <NuxtPage />
  </div>
</template>
