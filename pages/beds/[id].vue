<script setup lang="ts">
import { nutrientDemandLabel } from '~/utils/labels'
import { cropIcon } from '~/utils/cropVisuals'

const route = useRoute()
const store = useGardenStore()
store.initialize()

const bedId = computed(() => String(route.params.id))
const bed = computed(() => store.bedById(bedId.value))

const year = ref(new Date().getFullYear())
const cropId = ref('')

const records = computed(() => {
  const now = new Date().getFullYear()
  return store
    .recordsByBed(bedId.value)
    .filter((record) => record.year >= now - 4)
})

const rotation = computed(() => {
  if (!cropId.value || !bed.value) {
    return { warnings: [], recommendedCropIds: [] }
  }

  return store.evaluateRotation(bedId.value, cropId.value, year.value)
})

const recommendedCrops = computed(() => {
  return rotation.value.recommendedCropIds
    .map((id) => store.cropById(id))
    .filter((crop): crop is NonNullable<typeof crop> => Boolean(crop))
})

const addPlanting = () => {
  if (!bed.value || !cropId.value || !year.value) {
    return
  }

  store.addRecord({
    bedId: bedId.value,
    cropId: cropId.value,
    year: Number(year.value)
  })

  cropId.value = ''
}
</script>

<template>
  <section v-if="bed" class="space-y-6">
    <div class="card-soft p-4">
      <h2 class="text-xl font-semibold text-emerald-700">🪴 {{ bed.name }}</h2>
      <p class="text-sm text-slate-600">{{ bed.width }}m x {{ bed.height }}m</p>
      <p class="mt-2 text-sm text-slate-700">{{ bed.notes || 'Keine Notizen für dieses Beet.' }}</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="card-soft p-4">
        <h3 class="mb-3 text-lg font-semibold">Anpflanzung hinzufügen</h3>
        <form class="space-y-3" @submit.prevent="addPlanting">
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Jahr</span>
            <input v-model.number="year" class="w-full rounded-md border border-slate-300 px-3 py-2" type="number" min="2000" max="2100" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Kultur</span>
            <select v-model="cropId" class="w-full rounded-md border border-slate-300 px-3 py-2" required>
              <option disabled value="">Kultur auswählen</option>
              <option v-for="crop in store.crops" :key="crop.id" :value="crop.id">
                {{ cropIcon(crop) }} {{ crop.name }} ({{ crop.family }} / {{ nutrientDemandLabel(crop.nutrientDemand) }})
              </option>
            </select>
          </label>
          <button class="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" type="submit">
            Anpflanzung speichern
          </button>
        </form>
      </div>

      <RotationWarnings :warnings="rotation.warnings" :recommended-crops="recommendedCrops" />
    </div>

    <PlantingHistoryTable :records="records" :crops="store.crops" />
  </section>

  <section v-else class="card-soft p-4">
    <p>Beet nicht gefunden.</p>
  </section>
</template>
