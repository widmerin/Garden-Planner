<script setup lang="ts">
import type { Crop, NutrientDemand } from '~/types/models'
import { nutrientDemandLabel } from '~/utils/labels'

const store = useGardenStore()
store.initialize()

const isFormOpen = ref(true)
const cropEditId = ref<string | null>(null)
const cropForm = reactive({
  name: '',
  family: '',
  nutrientDemand: 'medium' as NutrientDemand,
  goodNeighborsText: '',
  badNeighborsText: ''
})

const parseNeighborList = (text: string): string[] => {
  return text
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const listToText = (list: string[] | undefined): string => (list && list.length ? list.join(', ') : '')

const startCropEdit = (crop: Crop) => {
  isFormOpen.value = true
  cropEditId.value = crop.id
  cropForm.name = crop.name
  cropForm.family = crop.family
  cropForm.nutrientDemand = crop.nutrientDemand
  cropForm.goodNeighborsText = listToText(crop.goodNeighbors)
  cropForm.badNeighborsText = listToText(crop.badNeighbors)
}

const resetCropForm = () => {
  cropEditId.value = null
  cropForm.name = ''
  cropForm.family = ''
  cropForm.nutrientDemand = 'medium'
  cropForm.goodNeighborsText = ''
  cropForm.badNeighborsText = ''
}

const saveCrop = () => {
  if (!cropForm.name.trim() || !cropForm.family.trim()) {
    return
  }

  const payload = {
    name: cropForm.name.trim(),
    family: cropForm.family.trim(),
    nutrientDemand: cropForm.nutrientDemand,
    goodNeighbors: parseNeighborList(cropForm.goodNeighborsText),
    badNeighbors: parseNeighborList(cropForm.badNeighborsText)
  }

  if (cropEditId.value) {
    store.updateCrop(cropEditId.value, payload)
  } else {
    store.addCrop(payload)
  }

  resetCropForm()
}
</script>

<template>
  <section class="space-y-6">
    <div class="card-soft p-4">
      <h2 class="text-xl font-semibold text-emerald-900">Kulturliste & Kultur hinzufügen</h2>
      <p class="mt-1 text-sm text-slate-600">Bearbeite bestehende Kulturen oder lege neue Kulturen an.</p>
    </div>

    <div class="card-soft p-4">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h2 class="text-xl font-semibold">{{ cropEditId ? 'Kultur bearbeiten' : 'Kultur hinzufügen' }}</h2>
        <button
          class="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          type="button"
          @click="isFormOpen = !isFormOpen"
        >
          {{ isFormOpen ? 'Ausblenden' : 'Einblenden' }}
        </button>
      </div>

      <form v-if="isFormOpen" class="space-y-3" @submit.prevent="saveCrop">
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Name</span>
          <input v-model="cropForm.name" class="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2" required />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Familie</span>
          <input v-model="cropForm.family" class="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2" required />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Nährstoffbedarf</span>
          <select v-model="cropForm.nutrientDemand" class="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="low">niedrig</option>
            <option value="medium">mittel</option>
            <option value="high">hoch</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Gute Nachbarn (kommagetrennt)</span>
          <input v-model="cropForm.goodNeighborsText" class="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="z.B. Karotte, Salat" />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Schlechte Nachbarn (kommagetrennt)</span>
          <input v-model="cropForm.badNeighborsText" class="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="z.B. Kartoffeln, Zwiebel" />
        </label>
        <div class="flex flex-wrap gap-2">
          <button class="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" type="submit">
            Kultur speichern
          </button>
          <button class="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-sm hover:bg-slate-300" type="button" @click="resetCropForm">
            Zurücksetzen
          </button>
        </div>
      </form>
    </div>

    <div class="card-soft p-4">
      <h2 class="mb-3 text-xl font-semibold">Kulturliste</h2>
      <div class="space-y-2 md:hidden">
        <article
          v-for="crop in store.crops"
          :key="`mobile-${crop.id}`"
          class="rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <p class="font-semibold text-slate-800">{{ crop.name }}</p>
            <button class="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs hover:bg-slate-200" @click="startCropEdit(crop)">
              Bearbeiten
            </button>
          </div>
          <p class="text-xs text-slate-600">Familie: {{ crop.family }}</p>
          <p class="text-xs text-slate-600">Nährstoffbedarf: {{ nutrientDemandLabel(crop.nutrientDemand) }}</p>
          <p class="text-xs text-slate-600">Gute Nachbarn: {{ crop.goodNeighbors?.join(', ') || '-' }}</p>
          <p class="text-xs text-slate-600">Schlechte Nachbarn: {{ crop.badNeighbors?.join(', ') || '-' }}</p>
        </article>
      </div>

      <div class="hidden max-h-[30rem] overflow-auto md:block">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-slate-600">
              <th class="pb-2">Name</th>
              <th class="pb-2">Familie</th>
              <th class="pb-2">Nährstoff</th>
              <th class="pb-2">Gute Nachbarn</th>
              <th class="pb-2">Schlechte Nachbarn</th>
              <th class="pb-2">Aktion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="crop in store.crops" :key="crop.id" class="border-b border-slate-100 align-top">
              <td class="py-2">{{ crop.name }}</td>
              <td class="py-2">{{ crop.family }}</td>
              <td class="py-2">{{ nutrientDemandLabel(crop.nutrientDemand) }}</td>
              <td class="py-2 text-xs text-slate-600">{{ crop.goodNeighbors?.join(', ') || '-' }}</td>
              <td class="py-2 text-xs text-slate-600">{{ crop.badNeighbors?.join(', ') || '-' }}</td>
              <td class="py-2">
                <button class="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs hover:bg-slate-200" @click="startCropEdit(crop)">
                  Bearbeiten
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
