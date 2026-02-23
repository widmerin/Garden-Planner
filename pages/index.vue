<script setup lang="ts">
import { cropIcon } from '~/utils/cropVisuals'
import type { NutrientDemand } from '~/types/models'
import { nutrientDemandLabel } from '~/utils/labels'

const store = useGardenStore()
store.initialize()

const lastYear = new Date().getFullYear() - 1

const summary = computed(() => {
  return store.beds.map((bed) => {
    const lastYearCrops = store.records
      .filter((record) => record.bedId === bed.id && record.year === lastYear)
      .map((record) => store.cropById(record.cropId))
      .filter((crop): crop is NonNullable<typeof crop> => Boolean(crop))

    const years = Array.from({ length: 5 }, (_, idx) => new Date().getFullYear() - idx)
    const timeline = years.map((year) => {
      const crops = store.records
        .filter((record) => record.bedId === bed.id && record.year === year)
        .map((record) => store.cropById(record.cropId))
        .filter((crop): crop is NonNullable<typeof crop> => Boolean(crop))

      return { year, crops }
    })

    return {
      bed,
      lastYearCrops,
      timeline
    }
  })
})

const hasHighDemand = (value: NutrientDemand | string): boolean => {
  const normalized = String(value).toLowerCase().trim()
  return normalized === 'high' || normalized === 'hoch'
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold text-emerald-900 sm:text-2xl">Beet-Übersicht</h2>
      <NuxtLink class="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" to="/beds">
        + Beete verwalten
      </NuxtLink>
    </div>

    <div class="card-soft flex flex-wrap items-center gap-3 p-3 text-xs font-medium">
      <span class="text-slate-600">Nährstoffbedarf:</span>
      <span class="text-slate-700">⚡ = hoher Bedarf</span>
    </div>

    <div class="space-y-3 md:hidden">
      <article v-for="item in summary" :key="`mobile-${item.bed.id}`" class="card-soft p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold text-emerald-800">🪴 {{ item.bed.name }}</h3>
            <p class="text-xs text-slate-600">{{ item.bed.width }}m x {{ item.bed.height }}m</p>
          </div>
          <NuxtLink
            :to="`/beds/${item.bed.id}`"
            class="inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Details
          </NuxtLink>
        </div>

        <div class="mt-2">
          <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Letztes Jahr ({{ lastYear }})</p>
          <div v-if="item.lastYearCrops.length" class="flex flex-wrap gap-1.5">
            <span v-for="crop in item.lastYearCrops" :key="`mobile-${item.bed.id}-${crop.id}`" class="chip-crop">
              <span>{{ cropIcon(crop) }}</span>
              <span class="truncate">{{ crop.name }}</span>
              <span
                v-if="hasHighDemand(crop.nutrientDemand)"
                :title="`Nährstoffbedarf: ${nutrientDemandLabel(crop.nutrientDemand)}`"
                class="text-xs"
              >
                ⚡
              </span>
            </span>
          </div>
          <p v-else class="text-xs text-slate-500">Keine Einträge</p>
        </div>

        <details class="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <summary class="cursor-pointer text-xs font-semibold text-slate-700">Historie (5 Jahre)</summary>
          <div class="mt-2 space-y-1.5">
            <div
              v-for="entry in item.timeline"
              :key="`mobile-${item.bed.id}-${entry.year}`"
              class="rounded-md border border-emerald-100 bg-white p-2"
            >
              <p class="text-[11px] font-semibold text-emerald-900">{{ entry.year }}</p>
              <div class="mt-1 flex flex-wrap gap-1">
                <span v-if="!entry.crops.length" class="text-[11px] text-slate-500">-</span>
                <span v-for="crop in entry.crops" :key="`mobile-${item.bed.id}-${entry.year}-${crop.id}`" class="chip-crop">
                  <span>{{ cropIcon(crop) }}</span>
                  <span class="truncate">{{ crop.name }}</span>
                  <span
                    v-if="hasHighDemand(crop.nutrientDemand)"
                    :title="`Nährstoffbedarf: ${nutrientDemandLabel(crop.nutrientDemand)}`"
                    class="text-xs"
                  >
                    ⚡
                  </span>
                </span>
              </div>
            </div>
          </div>
        </details>
      </article>
    </div>

    <div class="hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-3">
      <article v-for="item in summary" :key="item.bed.id" class="card-soft p-4">
        <div class="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 class="text-lg font-semibold text-emerald-800">🪴 {{ item.bed.name }}</h3>
            <p class="text-sm text-slate-600">{{ item.bed.width }}m x {{ item.bed.height }}m</p>
          </div>
          <NuxtLink
            :to="`/beds/${item.bed.id}`"
            class="inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Details
          </NuxtLink>
        </div>

        <div class="mb-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Letztes Jahr ({{ lastYear }})</p>
          <div v-if="item.lastYearCrops.length" class="flex flex-wrap gap-2">
            <span v-for="crop in item.lastYearCrops" :key="`${item.bed.id}-${crop.id}`" class="chip-crop">
              <span>{{ cropIcon(crop) }}</span>
              <span>{{ crop.name }}</span>
              <span
                v-if="hasHighDemand(crop.nutrientDemand)"
                :title="`Nährstoffbedarf: ${nutrientDemandLabel(crop.nutrientDemand)}`"
                class="text-sm"
              >
                ⚡
              </span>
            </span>
          </div>
          <p v-else class="text-sm text-slate-500">Keine Einträge</p>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Historie (5 Jahre)</p>
          <div
            v-for="entry in item.timeline"
            :key="`${item.bed.id}-${entry.year}`"
            class="grid grid-cols-1 items-start gap-1 rounded-lg border border-emerald-100 bg-emerald-50/40 p-2 sm:grid-cols-[4.2rem_1fr] sm:gap-2"
          >
            <span class="text-sm font-semibold text-emerald-900">{{ entry.year }}</span>
            <div class="flex flex-wrap gap-1.5">
              <span v-if="!entry.crops.length" class="text-xs text-slate-500">-</span>
              <span v-for="crop in entry.crops" :key="`${item.bed.id}-${entry.year}-${crop.id}`" class="chip-crop">
                <span>{{ cropIcon(crop) }}</span>
                <span>{{ crop.name }}</span>
                <span
                  v-if="hasHighDemand(crop.nutrientDemand)"
                  :title="`Nährstoffbedarf: ${nutrientDemandLabel(crop.nutrientDemand)}`"
                  class="text-sm"
                >
                  ⚡
                </span>
              </span>
            </div>
          </div>
        </div>

        <NuxtLink :to="`/beds/${item.bed.id}`" class="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
          Zum Beet →
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
