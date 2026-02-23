<script setup lang="ts">
import type { Crop, NutrientDemand } from '~/types/models'
import { nutrientDemandLabel } from '~/utils/labels'

const store = useGardenStore()
store.initialize()

const storage = useGardenStorage()
const importText = ref('')
const message = ref('')

const cropEditId = ref<string | null>(null)
const cropForm = reactive<Omit<Crop, 'id'>>({
  name: '',
  family: '',
  nutrientDemand: 'medium'
})

const downloadExport = () => {
  const content = storage.exportJson(store.toData())
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `garden-planner-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const importData = () => {
  const parsed = storage.importJson(importText.value)
  if (!parsed) {
    message.value = 'Import fehlgeschlagen: Ungültiges JSON-Datenformat.'
    return
  }

  store.replaceAllData(parsed)
  message.value = 'Import erfolgreich.'
}

const startCropEdit = (crop: Crop) => {
  cropEditId.value = crop.id
  cropForm.name = crop.name
  cropForm.family = crop.family
  cropForm.nutrientDemand = crop.nutrientDemand
}

const resetCropForm = () => {
  cropEditId.value = null
  cropForm.name = ''
  cropForm.family = ''
  cropForm.nutrientDemand = 'medium'
}

const saveCrop = () => {
  if (!cropForm.name.trim() || !cropForm.family.trim()) {
    return
  }

  const payload = {
    name: cropForm.name.trim(),
    family: cropForm.family.trim(),
    nutrientDemand: cropForm.nutrientDemand as NutrientDemand
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
    <div class="grid gap-6 lg:grid-cols-2">
      <div class="card-soft p-4">
        <h2 class="mb-3 text-xl font-semibold">Export</h2>
        <p class="mb-4 text-sm text-slate-600">Lade ein vollständiges Backup von Beeten, Kulturen und Pflanzhistorie herunter.</p>
        <button class="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" @click="downloadExport">
          JSON exportieren
        </button>
      </div>

      <div class="card-soft p-4">
        <h2 class="mb-3 text-xl font-semibold">Import</h2>
        <p class="mb-2 text-sm text-slate-600">Füge ein Backup-JSON ein, um alle Daten wiederherzustellen.</p>
        <textarea
          v-model="importText"
          class="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
          rows="10"
          placeholder='{"crops":[...],"gardenBeds":[...],"plantingRecords":[...]}'
        />
        <div class="flex flex-wrap items-center gap-3">
          <button class="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" @click="importData">
            JSON importieren
          </button>
          <span class="text-sm text-slate-700">{{ message }}</span>
        </div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
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
          </article>
        </div>

        <div class="hidden max-h-[24rem] overflow-auto md:block">
          <table class="w-full border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-slate-600">
                <th class="pb-2">Name</th>
                <th class="pb-2">Familie</th>
                <th class="pb-2">Nährstoffbedarf</th>
                <th class="pb-2">Aktion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="crop in store.crops" :key="crop.id" class="border-b border-slate-100">
                <td class="py-2">{{ crop.name }}</td>
                <td class="py-2">{{ crop.family }}</td>
                <td class="py-2">{{ nutrientDemandLabel(crop.nutrientDemand) }}</td>
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

      <div class="card-soft p-4">
        <h2 class="mb-3 text-xl font-semibold">{{ cropEditId ? 'Kultur bearbeiten' : 'Kultur hinzufügen' }}</h2>
        <form class="space-y-3" @submit.prevent="saveCrop">
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
    </div>
  </section>
</template>
