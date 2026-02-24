<script setup lang="ts">
import { suggestBedDistribution } from '~/utils/planner'
import { cropIcon } from '~/utils/cropVisuals'
import { nutrientDemandLabel } from '~/utils/labels'

const store = useGardenStore()
store.initialize()

const currentYear = new Date().getFullYear()
const selectedCropIds = ref<string[]>([])
const resultMessage = ref('')
const suggestion = ref<ReturnType<typeof suggestBedDistribution> | null>(null)

const maxSelectable = computed(() => store.beds.length)

const cropById = computed(() => new Map(store.crops.map((crop) => [crop.id, crop])))
const bedById = computed(() => new Map(store.beds.map((bed) => [bed.id, bed])))

const isSelected = (cropId: string): boolean => selectedCropIds.value.includes(cropId)

const canSelectMore = computed(() => selectedCropIds.value.length < maxSelectable.value)

const toggleCrop = (cropId: string) => {
  if (isSelected(cropId)) {
    selectedCropIds.value = selectedCropIds.value.filter((id) => id !== cropId)
    return
  }

  if (!canSelectMore.value) {
    return
  }

  selectedCropIds.value = [...selectedCropIds.value, cropId]
}

const generateSuggestion = () => {
  suggestion.value = suggestBedDistribution(
    selectedCropIds.value,
    store.beds,
    store.crops,
    store.records,
    currentYear
  )

  resultMessage.value = ''
}

const applySuggestion = () => {
  if (!suggestion.value || suggestion.value.assignments.length === 0) {
    return
  }

  store.applyYearPlan(suggestion.value.assignments, currentYear)
  resultMessage.value = `Plan für ${currentYear} gespeichert.`
}
</script>

<template>
  <section class="space-y-6">
    <div class="card-soft p-4">
      <h2 class="text-xl font-semibold text-emerald-900">Planung {{ currentYear }}</h2>
      <p class="mt-1 text-sm text-slate-600">
        Wähle bis zu {{ maxSelectable }} Kulturen aus. Danach wird eine Beet-Zuordnung anhand der Historie vorgeschlagen.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div class="card-soft p-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-lg font-semibold">Kulturen auswählen</h3>
          <span class="text-sm text-slate-600">{{ selectedCropIds.length }} / {{ maxSelectable }}</span>
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="crop in store.crops"
            :key="crop.id"
            :disabled="!isSelected(crop.id) && !canSelectMore"
            class="flex min-h-11 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-45"
            :class="isSelected(crop.id) ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700'"
            type="button"
            @click="toggleCrop(crop.id)"
          >
            <span class="inline-flex items-center gap-2">
              <span>{{ cropIcon(crop) }}</span>
              <span>{{ crop.name }}</span>
              <span class="text-xs text-slate-500">({{ nutrientDemandLabel(crop.nutrientDemand) }})</span>
            </span>
            <span v-if="isSelected(crop.id)" class="text-xs font-semibold">Ausgewählt</span>
          </button>
        </div>

        <button
          class="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          :disabled="selectedCropIds.length === 0"
          type="button"
          @click="generateSuggestion"
        >
          Verteilung vorschlagen
        </button>
      </div>

      <div class="card-soft p-4">
        <h3 class="text-lg font-semibold">Vorschlag</h3>
        <p v-if="!suggestion" class="mt-2 text-sm text-slate-500">Noch kein Vorschlag erstellt.</p>

        <div v-else class="mt-3 space-y-3">
          <article
            v-for="entry in suggestion.assignments"
            :key="`${entry.bedId}-${entry.cropId}`"
            class="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <p class="text-sm font-semibold text-slate-800">
              {{ bedById.get(entry.bedId)?.name || 'Unbekanntes Beet' }}
            </p>
            <p class="mt-1 text-sm text-emerald-800">
              {{ cropIcon(cropById.get(entry.cropId)) }} {{ cropById.get(entry.cropId)?.name || 'Unbekannte Kultur' }}
            </p>
            <p class="mt-1 text-xs text-slate-600">
              Nährstoffbedarf: {{ nutrientDemandLabel(cropById.get(entry.cropId)?.nutrientDemand ?? '') }}
            </p>
            <ul v-if="entry.warnings.length" class="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-800">
              <li v-for="warning in entry.warnings" :key="warning.code + warning.message">{{ warning.message }}</li>
            </ul>
            <p v-else class="mt-2 text-xs text-emerald-700">Keine Warnungen.</p>
          </article>

          <p v-if="suggestion.unassignedCropIds.length" class="text-xs text-slate-600">
            Nicht zugeordnet: {{ suggestion.unassignedCropIds.length }} (mehr Kulturen als Beete)
          </p>

          <button
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            :disabled="suggestion.assignments.length === 0"
            type="button"
            @click="applySuggestion"
          >
            Plan speichern
          </button>
          <p class="text-sm text-slate-700">{{ resultMessage }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
