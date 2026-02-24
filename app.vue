<script setup lang="ts">
const route = useRoute()
const currentYear = new Date().getFullYear()
const mobileMenuOpen = ref(false)

const navClass = (path: string): string => {
  const active =
    path === '/'
      ? route.path === '/'
      : route.path === path || route.path.startsWith(`${path}/`)
  return active
    ? 'inline-flex min-h-11 w-full items-center justify-center border-b-2 border-emerald-600 px-2 py-2 font-semibold text-emerald-700 sm:w-auto'
    : 'inline-flex min-h-11 w-full items-center justify-center border-b-2 border-transparent px-2 py-2 text-slate-600 hover:border-slate-300 hover:text-slate-900 sm:w-auto'
}

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  }
)
</script>

<template>
  <div class="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
    <header class="card-soft mb-5 overflow-hidden p-4 sm:mb-6 sm:p-5">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-emerald-800">🌿 Anbauplan</h1>
        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 sm:hidden"
          type="button"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-nav"
          aria-label="Menü öffnen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          ☰
        </button>
        <span class="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 sm:inline-flex">
          Fruchtfolge im Blick
        </span>
      </div>

      <nav
        id="mobile-nav"
        v-show="mobileMenuOpen"
        class="mt-4 grid grid-cols-1 gap-1 border-b border-slate-200 text-sm sm:hidden"
      >
        <NuxtLink :class="navClass('/')" to="/">Übersicht</NuxtLink>
        <NuxtLink :class="navClass('/beds')" to="/beds">Beete</NuxtLink>
        <NuxtLink :class="navClass('/planung')" to="/planung">Planung {{ currentYear }}</NuxtLink>
        <NuxtLink :class="navClass('/kulturen')" to="/kulturen">Kulturen</NuxtLink>
        <NuxtLink :class="navClass('/settings')" to="/settings">Einstellungen</NuxtLink>
      </nav>

      <nav class="mt-4 hidden border-b border-slate-200 text-sm sm:flex sm:flex-wrap sm:gap-5">
        <NuxtLink :class="navClass('/')" to="/">Übersicht</NuxtLink>
        <NuxtLink :class="navClass('/beds')" to="/beds">Beete</NuxtLink>
        <NuxtLink :class="navClass('/planung')" to="/planung">Planung {{ currentYear }}</NuxtLink>
        <NuxtLink :class="navClass('/kulturen')" to="/kulturen">Kulturen</NuxtLink>
        <NuxtLink :class="navClass('/settings')" to="/settings">Einstellungen</NuxtLink>
      </nav>
    </header>

    <NuxtPage />
  </div>
</template>
