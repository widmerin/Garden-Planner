<script setup lang="ts">
import { cropIcon } from '~/utils/cropVisuals'
import type { NutrientDemand } from '~/types/models'
import { nutrientDemandLabel } from '~/utils/labels'
import { mainAndCompanionForBedYear } from '~/utils/companions'

const store = useGardenStore()
store.initialize()

const currentYear = new Date().getFullYear()

const summary = computed(() => {
  return store.beds.map((bed) => {
    const current = mainAndCompanionForBedYear(store.records, bed.id, currentYear)
    const mainCrop = current.mainRecord ? store.cropById(current.mainRecord.cropId) : null
    const companionCrops = current.companionRecords
      .map((record) => store.cropById(record.cropId))
      .filter((crop): crop is NonNullable<typeof crop> => Boolean(crop))

    const years = Array.from({ length: 5 }, (_, idx) => currentYear - idx)
    const compactHistory = years
      .map((year) => {
        const yearData = mainAndCompanionForBedYear(store.records, bed.id, year)
        const yearMainCrop = yearData.mainRecord ? store.cropById(yearData.mainRecord.cropId) : null
        const yearCompanions = yearData.companionRecords
          .map((record) => store.cropById(record.cropId))
          .filter((crop): crop is NonNullable<typeof crop> => Boolean(crop))

        return {
          year,
          mainCrop: yearMainCrop,
          companions: yearCompanions
        }
      })
      .filter((entry) => entry.mainCrop || entry.companions.length > 0)
      .slice(0, 3)

    return {
      bed,
      hasCurrentYearData: Boolean(mainCrop) || companionCrops.length > 0,
      mainCrop,
      companionCrops,
      compactHistory
    }
  })
})

const hasHighDemand = (value: NutrientDemand | string): boolean => {
  const normalized = String(value).toLowerCase().trim()
  return normalized === 'high' || normalized === 'hoch'
}

const openBed = async (bedId: string) => {
  await navigateTo(`/beds/${bedId}`)
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-2">
      <h2 class="text-xl font-semibold text-emerald-900 sm:text-2xl">Beet-Übersicht</h2>
    </div>

    <div class="card-soft border border-sky-200 bg-sky-50/60 p-3 text-xs text-sky-900">
      <p class="inline-flex items-center gap-1.5 font-semibold">
        <span aria-hidden="true">ℹ️</span>
        <span>Hinweis</span>
      </p>
      <p class="mt-1">
        Alle Änderungen werden nur lokal in diesem Browser auf diesem Gerät gespeichert.
        Für Sicherung oder Übertragung nutze bitte den JSON-Export unter Einstellungen.
      </p>
    </div>

    <div class="space-y-3 md:hidden">
      <article
        v-for="item in summary"
        :key="`mobile-${item.bed.id}`"
        class="card-soft cursor-pointer p-3"
        role="link"
        tabindex="0"
        @click="openBed(item.bed.id)"
        @keydown.enter.prevent="openBed(item.bed.id)"
        @keydown.space.prevent="openBed(item.bed.id)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold text-emerald-800">🪴 {{ item.bed.name }}</h3>
            <p class="text-xs text-slate-600">{{ item.bed.width }}m x {{ item.bed.height }}m</p>
          </div>
          <span class="text-xs font-semibold text-emerald-700">Details →</span>
        </div>

        <div class="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/30 p-2">
          <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Aktuelles Beetjahr ({{ currentYear }})</p>

          <div v-if="item.mainCrop" class="mb-1 flex items-center gap-1.5 text-xs text-emerald-900">
            <span class="font-semibold">Hauptkultur:</span>
            <span class="chip-crop">
              <span>{{ cropIcon(item.mainCrop) }}</span>
              <span>{{ item.mainCrop.name }}</span>
              <span
                v-if="hasHighDemand(item.mainCrop.nutrientDemand)"
                :title="`Nährstoffbedarf: ${nutrientDemandLabel(item.mainCrop.nutrientDemand)}`"
                class="text-xs"
              >
                ⚡
              </span>
            </span>
          </div>

          <div v-if="item.companionCrops.length" class="text-xs">
            <p class="mb-1 font-semibold text-slate-700">Nebenkulturen:</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="crop in item.companionCrops" :key="`mobile-${item.bed.id}-${crop.id}`" class="chip-crop">
                <span>{{ cropIcon(crop) }}</span>
                <span class="truncate">{{ crop.name }}</span>
              </span>
            </div>
          </div>

          <NuxtLink
            v-if="!item.hasCurrentYearData"
            :to="`/beds/${item.bed.id}`"
            class="inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Kultur für {{ currentYear }} hinzufügen
          </NuxtLink>
        </div>

        <div class="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Letzte Historie</p>
          <div v-if="item.compactHistory.length" class="space-y-1.5">
            <div
              v-for="entry in item.compactHistory"
              :key="`mobile-${item.bed.id}-${entry.year}`"
              class="rounded-md border border-emerald-100 bg-white p-2"
            >
              <p class="text-[11px] font-semibold text-emerald-900">{{ entry.year }}</p>
              <p v-if="entry.mainCrop" class="text-xs text-slate-700">
                Hauptkultur: {{ cropIcon(entry.mainCrop) }} {{ entry.mainCrop.name }}
              </p>
              <p v-if="entry.companions.length" class="text-xs text-slate-600">
                Nebenkulturen: {{ entry.companions.length }}
              </p>
            </div>
          </div>
          <p v-else class="text-xs text-slate-500">Keine Historie</p>
        </div>
      </article>
    </div>

    <div class="hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="item in summary"
        :key="item.bed.id"
        class="card-soft cursor-pointer p-4"
        role="link"
        tabindex="0"
        @click="openBed(item.bed.id)"
        @keydown.enter.prevent="openBed(item.bed.id)"
        @keydown.space.prevent="openBed(item.bed.id)"
      >
        <div class="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 class="text-lg font-semibold text-emerald-800">🪴 {{ item.bed.name }}</h3>
            <p class="text-sm text-slate-600">{{ item.bed.width }}m x {{ item.bed.height }}m</p>
          </div>
          <span class="text-xs font-semibold text-emerald-700">Details →</span>
        </div>

        <div class="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Aktuelles Beetjahr ({{ currentYear }})</p>

          <div v-if="item.mainCrop" class="mb-2">
            <p class="mb-1 text-xs font-semibold text-slate-700">Hauptkultur</p>
            <span class="chip-crop">
              <span>{{ cropIcon(item.mainCrop) }}</span>
              <span>{{ item.mainCrop.name }}</span>
              <span
                v-if="hasHighDemand(item.mainCrop.nutrientDemand)"
                :title="`Nährstoffbedarf: ${nutrientDemandLabel(item.mainCrop.nutrientDemand)}`"
                class="text-sm"
              >
                ⚡
              </span>
            </span>
          </div>

          <div v-if="item.companionCrops.length">
            <p class="mb-1 text-xs font-semibold text-slate-700">Nebenkulturen</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="crop in item.companionCrops" :key="`${item.bed.id}-${crop.id}`" class="chip-crop">
                <span>{{ cropIcon(crop) }}</span>
                <span>{{ crop.name }}</span>
              </span>
            </div>
          </div>

          <NuxtLink
            v-if="!item.hasCurrentYearData"
            :to="`/beds/${item.bed.id}`"
            class="inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Kultur für {{ currentYear }} hinzufügen
          </NuxtLink>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Letzte Historie</p>
          <div v-if="item.compactHistory.length" class="space-y-1.5">
            <div
              v-for="entry in item.compactHistory"
              :key="`${item.bed.id}-${entry.year}`"
              class="rounded-lg border border-emerald-100 bg-emerald-50/40 p-2"
            >
              <p class="text-sm font-semibold text-emerald-900">{{ entry.year }}</p>
              <p v-if="entry.mainCrop" class="text-xs text-slate-700">
                Hauptkultur: {{ cropIcon(entry.mainCrop) }} {{ entry.mainCrop.name }}
              </p>
              <p v-if="entry.companions.length" class="text-xs text-slate-600">
                Nebenkulturen: {{ entry.companions.length }}
              </p>
            </div>
          </div>
          <p v-else class="text-sm text-slate-500">Keine Historie</p>
        </div>
      </article>
    </div>
  </section>
</template>
