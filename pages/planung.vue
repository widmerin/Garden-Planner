<script setup lang="ts">
import { suggestBedDistribution } from '~/utils/planner'
import { cropIcon } from '~/utils/cropVisuals'
import { nutrientDemandLabel } from '~/utils/labels'
import { companionConflictWarnings, evaluateCompanionFit, sortCompanionCandidates } from '~/utils/companions'

const store = useGardenStore()
store.initialize()

const currentYear = new Date().getFullYear()
const selectedCropIds = ref<string[]>([])
const resultMessage = ref('')
const suggestion = ref<ReturnType<typeof suggestBedDistribution> | null>(null)
const draggedAssignmentId = ref<string | null>(null)
const activeDropBedId = ref<string | null>(null)
const companionSelectionByBed = ref<Record<string, string>>({})
const step = ref<1 | 2 | 3>(1)

const maxSelectable = computed(() => store.beds.length)

const cropById = computed(() => new Map(store.crops.map((crop) => [crop.id, crop])))
const bedById = computed(() => new Map(store.beds.map((bed) => [bed.id, bed])))
const sortedCrops = computed(() => [...store.crops].sort((a, b) => a.name.localeCompare(b.name, 'de')))

const selectedCountByCrop = computed(() => {
  const map = new Map<string, number>()
  for (const cropId of selectedCropIds.value) {
    map.set(cropId, (map.get(cropId) ?? 0) + 1)
  }
  return map
})

const selectedCount = (cropId: string): number => selectedCountByCrop.value.get(cropId) ?? 0

const canSelectMore = computed(() => selectedCropIds.value.length < maxSelectable.value)

const addCrop = (cropId: string) => {
  if (!canSelectMore.value) {
    return
  }

  selectedCropIds.value = [...selectedCropIds.value, cropId]
  suggestion.value = null
  if (step.value > 1) {
    step.value = 1
  }
}

const removeCrop = (cropId: string) => {
  const index = selectedCropIds.value.findIndex((id) => id === cropId)
  if (index < 0) {
    return
  }

  selectedCropIds.value = selectedCropIds.value.filter((_, idx) => idx !== index)
  suggestion.value = null
  if (step.value > 1) {
    step.value = 1
  }
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
  companionSelectionByBed.value = {}
}

const applySuggestion = () => {
  if (!suggestion.value || suggestion.value.assignments.length === 0) {
    return
  }

  store.applyYearPlan(suggestion.value.assignments, currentYear)
  resultMessage.value = `Plan für ${currentYear} gespeichert.`
}

const assignmentForBed = (bedId: string) => {
  return suggestion.value?.assignments.find((entry) => entry.bedId === bedId)
}

const isDragging = computed(() => draggedAssignmentId.value !== null)

const onDragStart = (assignmentId: string) => {
  draggedAssignmentId.value = assignmentId
}

const onDragEnd = () => {
  draggedAssignmentId.value = null
  activeDropBedId.value = null
}

const onDragEnterBed = (bedId: string) => {
  if (!isDragging.value) {
    return
  }
  activeDropBedId.value = bedId
}

const onDragLeaveBed = (bedId: string, event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }

  if (activeDropBedId.value === bedId) {
    activeDropBedId.value = null
  }
}

const onDropToBed = (targetBedId: string) => {
  if (!suggestion.value || !draggedAssignmentId.value) {
    return
  }

  const source = suggestion.value.assignments.find((entry) => entry.id === draggedAssignmentId.value)
  if (!source || source.bedId === targetBedId) {
    draggedAssignmentId.value = null
    return
  }

  const target = suggestion.value.assignments.find((entry) => entry.bedId === targetBedId)
  const oldBedId = source.bedId
  source.bedId = targetBedId

  if (target) {
    target.bedId = oldBedId
  }

  draggedAssignmentId.value = null
  activeDropBedId.value = null
}

const removeAssignmentFromSuggestion = (bedId: string) => {
  if (!suggestion.value) {
    return
  }

  const index = suggestion.value.assignments.findIndex((entry) => entry.bedId === bedId)
  if (index < 0) {
    return
  }

  const [removed] = suggestion.value.assignments.splice(index, 1)
  suggestion.value.unassignedCropIds.push(removed.cropId)
  delete companionSelectionByBed.value[bedId]
}

const companionOptionsForBed = (bedId: string) => {
  const assignment = assignmentForBed(bedId)
  if (!assignment) {
    return []
  }

  const mainCrop = cropById.value.get(assignment.cropId)
  if (!mainCrop) {
    return []
  }

  const excluded = new Set([mainCrop.id, ...assignment.companionCropIds])
  return sortCompanionCandidates(mainCrop, store.crops, excluded)
}

const addCompanionToBed = (bedId: string) => {
  if (!suggestion.value) {
    return
  }

  const selectedCropId = companionSelectionByBed.value[bedId]
  if (!selectedCropId) {
    return
  }

  const assignment = assignmentForBed(bedId)
  if (!assignment) {
    return
  }

  if (!assignment.companionCropIds.includes(selectedCropId)) {
    assignment.companionCropIds.push(selectedCropId)
  }

  companionSelectionByBed.value[bedId] = ''
}

const removeCompanionFromBed = (bedId: string, cropId: string) => {
  const assignment = assignmentForBed(bedId)
  if (!assignment) {
    return
  }

  assignment.companionCropIds = assignment.companionCropIds.filter((id) => id !== cropId)
}

const companionWarningsForBed = (bedId: string): string[] => {
  const assignment = assignmentForBed(bedId)
  if (!assignment) {
    return []
  }

  const mainCrop = cropById.value.get(assignment.cropId)
  if (!mainCrop) {
    return []
  }

  const companionCrops = assignment.companionCropIds
    .map((id) => cropById.value.get(id))
    .filter((crop): crop is NonNullable<typeof crop> => Boolean(crop))

  return companionConflictWarnings(mainCrop, companionCrops)
}

const companionFitHint = (bedId: string, cropId: string): string => {
  const assignment = assignmentForBed(bedId)
  if (!assignment) {
    return ''
  }

  const mainCrop = cropById.value.get(assignment.cropId)
  const candidate = cropById.value.get(cropId)
  if (!mainCrop || !candidate) {
    return ''
  }

  const fit = evaluateCompanionFit(mainCrop, candidate)
  if (fit.conflicts.length > 0) {
    return `⚠ ${fit.conflicts[0]}`
  }
  if (fit.reasons.length > 0) {
    return `✓ ${fit.reasons[0]}`
  }
  return 'Neutral'
}

const canGoToStep2 = computed(() => selectedCropIds.value.length > 0)
const canGoToStep3 = computed(() => Boolean(suggestion.value && suggestion.value.assignments.length > 0))

const goToStep = (targetStep: 1 | 2 | 3) => {
  if (targetStep === 1) {
    step.value = 1
    return
  }

  if (targetStep === 2 && canGoToStep2.value) {
    if (!suggestion.value) {
      generateSuggestion()
    }
    step.value = 2
    return
  }

  if (targetStep === 3 && canGoToStep3.value) {
    step.value = 3
  }
}

const nextStep = () => {
  if (step.value === 1) {
    if (!canGoToStep2.value) {
      return
    }
    generateSuggestion()
    step.value = 2
    return
  }

  if (step.value === 2 && canGoToStep3.value) {
    step.value = 3
  }
}

const prevStep = () => {
  if (step.value === 3) {
    step.value = 2
    return
  }

  if (step.value === 2) {
    step.value = 1
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="card-soft p-4">
      <h2 class="text-xl font-semibold text-emerald-900">Planung {{ currentYear }}</h2>
      <p class="mt-1 text-sm text-slate-600">
        Schrittweise Planung: Hauptkulturen wählen, Beeten zuordnen und Nebenkulturen ergänzen.
      </p>

      <div class="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          class="rounded-md border px-3 py-2 text-left text-sm"
          :class="step === 1 ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'"
          type="button"
          @click="goToStep(1)"
        >
          1. Hauptkulturen
        </button>
        <button
          class="rounded-md border px-3 py-2 text-left text-sm"
          :class="step === 2 ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 disabled:opacity-50'"
          :disabled="!canGoToStep2"
          type="button"
          @click="goToStep(2)"
        >
          2. Verteilung
        </button>
        <button
          class="rounded-md border px-3 py-2 text-left text-sm"
          :class="step === 3 ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 disabled:opacity-50'"
          :disabled="!canGoToStep3"
          type="button"
          @click="goToStep(3)"
        >
          3. Nebenkulturen
        </button>
      </div>
    </div>

    <div class="card-soft flex flex-wrap items-center justify-between gap-3 p-4">
      <button
        class="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300 disabled:opacity-50"
        :disabled="step === 1"
        type="button"
        @click="prevStep"
      >
        Zurück
      </button>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="step < 3"
          class="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          :disabled="(step === 1 && !canGoToStep2) || (step === 2 && !canGoToStep3)"
          type="button"
          @click="nextStep"
        >
          Weiter
        </button>

        <button
          v-else
          class="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          :disabled="!suggestion || suggestion.assignments.length === 0"
          type="button"
          @click="applySuggestion"
        >
          Plan speichern
        </button>
      </div>
    </div>

    <div
      v-if="resultMessage"
      class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
    >
      ✅ {{ resultMessage }}
    </div>

    <div v-if="step === 1" class="card-soft p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-lg font-semibold">Schritt 1: Hauptkulturen auswählen</h3>
        <span class="text-sm text-slate-600">{{ selectedCropIds.length }} / {{ maxSelectable }}</span>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <article
          v-for="crop in sortedCrops"
          :key="crop.id"
          class="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
        >
          <div class="grid grid-cols-[1fr_auto] items-center gap-2">
            <span class="inline-flex min-w-0 items-center gap-1.5">
              <span>{{ cropIcon(crop) }}</span>
              <span class="truncate font-medium">{{ crop.name }}</span>
              <span class="text-[10px] text-slate-500">({{ nutrientDemandLabel(crop.nutrientDemand) }})</span>
            </span>
            <div class="inline-flex w-auto items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1 py-0.5">
              <button
                class="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-45"
                :disabled="selectedCount(crop.id) === 0"
                type="button"
                @click="removeCrop(crop.id)"
              >
                -
              </button>
              <span class="inline-flex min-w-6 items-center justify-center text-[10px] font-semibold text-slate-600">
                {{ selectedCount(crop.id) }}
              </span>
              <button
                class="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-900 shadow-sm hover:bg-emerald-200 disabled:opacity-45"
                :disabled="!canSelectMore"
                type="button"
                @click="addCrop(crop.id)"
              >
                +
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div v-else class="card-soft p-4">
      <h3 class="text-lg font-semibold">
        {{ step === 2 ? 'Schritt 2: Hauptkulturen verteilen' : 'Schritt 3: Nebenkulturen ergänzen' }}
      </h3>
      <p v-if="!suggestion" class="mt-2 text-sm text-slate-500">Noch kein Vorschlag erstellt.</p>

      <div v-else class="mt-3 space-y-3">
        <p class="text-xs text-slate-600">Hauptkulturen können per Drag and Drop auf andere Beete verschoben werden.</p>

        <article
          v-for="bed in store.beds"
          :key="bed.id"
          class="rounded-lg border p-3 transition"
          :class="[
            activeDropBedId === bed.id
              ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
              : 'border-slate-200 bg-slate-50',
            isDragging && activeDropBedId !== bed.id ? 'opacity-80' : ''
          ]"
          @dragenter.prevent="onDragEnterBed(bed.id)"
          @dragleave="onDragLeaveBed(bed.id, $event)"
          @dragover.prevent="onDragEnterBed(bed.id)"
          @drop.prevent="onDropToBed(bed.id)"
        >
          <p class="text-sm font-semibold text-slate-800">{{ bedById.get(bed.id)?.name || 'Unbekanntes Beet' }}</p>
          <p
            v-if="isDragging && activeDropBedId === bed.id"
            class="mt-1 text-xs font-semibold text-emerald-700"
          >
            Hier ablegen
          </p>
          <div v-if="assignmentForBed(bed.id)" class="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2">
            <div
              draggable="true"
              class="cursor-move rounded-md border border-transparent p-1 transition"
              :class="draggedAssignmentId === assignmentForBed(bed.id)!.id ? 'border-emerald-300 bg-white/70 shadow-sm' : ''"
              @dragstart="onDragStart(assignmentForBed(bed.id)!.id)"
              @dragend="onDragEnd"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-semibold text-emerald-900">Hauptkultur</p>
                <button
                  class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                  type="button"
                  @click.stop="removeAssignmentFromSuggestion(bed.id)"
                  aria-label="Hauptkultur entfernen"
                >
                  ×
                </button>
              </div>
              <p class="mt-1 text-sm text-emerald-800">
                {{ cropIcon(cropById.get(assignmentForBed(bed.id)!.cropId)) }}
                {{ cropById.get(assignmentForBed(bed.id)!.cropId)?.name || 'Unbekannte Kultur' }}
              </p>
              <p class="mt-1 text-xs text-slate-600">
                Nährstoffbedarf: {{ nutrientDemandLabel(cropById.get(assignmentForBed(bed.id)!.cropId)?.nutrientDemand ?? '') }}
              </p>
            </div>

            <div v-if="step === 3" class="mt-3 rounded-md border border-slate-200 bg-white p-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">Nebenkulturen</p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <select
                  v-model="companionSelectionByBed[bed.id]"
                  class="min-h-10 min-w-[12rem] rounded-md border border-slate-300 px-2 py-1 text-xs"
                >
                  <option value="">Nebenkultur auswählen</option>
                  <option
                    v-for="candidate in companionOptionsForBed(bed.id)"
                    :key="`${bed.id}-${candidate.id}`"
                    :value="candidate.id"
                  >
                    {{ cropIcon(candidate) }} {{ candidate.name }} ({{ companionFitHint(bed.id, candidate.id) }})
                  </option>
                </select>
                <button
                  class="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  type="button"
                  @click="addCompanionToBed(bed.id)"
                >
                  Hinzufügen
                </button>
              </div>

              <div v-if="assignmentForBed(bed.id)!.companionCropIds.length" class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="companionId in assignmentForBed(bed.id)!.companionCropIds"
                  :key="`${bed.id}-${companionId}`"
                  class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                >
                  <span>{{ cropIcon(cropById.get(companionId)) }}</span>
                  <span>{{ cropById.get(companionId)?.name }}</span>
                  <button
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-slate-300"
                    type="button"
                    @click="removeCompanionFromBed(bed.id, companionId)"
                    aria-label="Nebenkultur entfernen"
                  >
                    ×
                  </button>
                </span>
              </div>
              <p v-else class="mt-2 text-xs text-slate-500">Noch keine Nebenkultur gewählt.</p>
            </div>

            <ul v-if="assignmentForBed(bed.id)!.warnings.length" class="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-800">
              <li v-for="warning in assignmentForBed(bed.id)!.warnings" :key="warning.code + warning.message">{{ warning.message }}</li>
            </ul>
            <ul v-if="step === 3 && companionWarningsForBed(bed.id).length" class="mt-2 list-disc space-y-1 pl-5 text-xs text-rose-700">
              <li v-for="warning in companionWarningsForBed(bed.id)" :key="`${bed.id}-${warning}`">{{ warning }}</li>
            </ul>
            <p
              v-if="!assignmentForBed(bed.id)!.warnings.length && !(step === 3 && companionWarningsForBed(bed.id).length)"
              class="mt-2 text-xs text-emerald-700"
            >
              Keine Warnungen.
            </p>
          </div>
          <p v-else class="mt-2 text-xs text-slate-500">Kein Vorschlag für dieses Beet.</p>
        </article>

        <p v-if="suggestion.unassignedCropIds.length" class="text-xs text-slate-600">
          Nicht zugeordnet: {{ suggestion.unassignedCropIds.length }} (mehr Hauptkulturen als Beete)
        </p>
      </div>
    </div>

  </section>
</template>
