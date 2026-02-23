<script setup lang="ts">
import type { GardenBed } from '~/types/models'
import { cropIcon } from '~/utils/cropVisuals'

const store = useGardenStore()
store.initialize()

const editId = ref<string | null>(null)
const form = reactive<Omit<GardenBed, 'id'>>({
  name: '',
  width: 1,
  height: 1,
  notes: ''
})

const resetForm = () => {
  form.name = ''
  form.width = 1
  form.height = 1
  form.notes = ''
  editId.value = null
}

const startEdit = (bed: GardenBed) => {
  editId.value = bed.id
  form.name = bed.name
  form.width = bed.width
  form.height = bed.height
  form.notes = bed.notes ?? ''
}

const saveBed = () => {
  const payload = {
    name: form.name.trim(),
    width: Number(form.width),
    height: Number(form.height),
    notes: form.notes.trim() || undefined
  }

  if (!payload.name || payload.width <= 0 || payload.height <= 0) {
    return
  }

  if (editId.value) {
    store.updateBed(editId.value, payload)
  } else {
    store.addBed(payload)
  }

  resetForm()
}

const removeBed = (bedId: string) => {
  store.deleteBed(bedId)
  if (editId.value === bedId) {
    resetForm()
  }
}

const recentCropsForBed = (bedId: string) => {
  const currentYear = new Date().getFullYear()
  const records = store.records
    .filter((record) => record.bedId === bedId && record.year >= currentYear - 1)
    .sort((a, b) => b.year - a.year)

  return records
    .map((record) => ({
      year: record.year,
      crop: store.cropById(record.cropId)
    }))
    .filter((item): item is { year: number; crop: NonNullable<typeof item.crop> } => Boolean(item.crop))
}
</script>

<template>
  <section class="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
    <div class="card-soft p-4">
      <h2 class="mb-3 text-xl font-semibold text-emerald-900">Gartenbeete</h2>
      <div class="space-y-3">
        <article
          v-for="bed in store.beds"
          :key="bed.id"
          class="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="font-semibold text-emerald-700">🪴 {{ bed.name }}</h3>
              <p class="text-sm text-slate-600">{{ bed.width }}m x {{ bed.height }}m</p>
              <p class="text-sm text-slate-500">{{ bed.notes || 'Keine Notizen' }}</p>
            </div>
            <div class="flex gap-2">
              <NuxtLink :to="`/beds/${bed.id}`" class="rounded-full bg-emerald-100 px-3 py-1.5 text-sm hover:bg-emerald-200">
                Details
              </NuxtLink>
              <button class="rounded-full bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200" @click="startEdit(bed)">
                Bearbeiten
              </button>
              <button class="rounded-full bg-rose-100 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-200" @click="removeBed(bed.id)">
                Löschen
              </button>
            </div>
          </div>
          <div class="mt-3">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Aktuelle/letzte Kulturen</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-if="!recentCropsForBed(bed.id).length" class="text-xs text-slate-500">Keine Einträge</span>
              <span
                v-for="item in recentCropsForBed(bed.id)"
                :key="`${bed.id}-${item.year}-${item.crop.id}`"
                class="chip-crop"
              >
                <span>{{ cropIcon(item.crop) }}</span>
                <span>{{ item.crop.name }}</span>
                <span class="text-[10px] text-slate-500">({{ item.year }})</span>
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="card-soft p-4">
      <h2 class="mb-3 text-xl font-semibold text-emerald-900">{{ editId ? 'Beet bearbeiten' : 'Beet hinzufügen' }}</h2>
      <form class="space-y-3" @submit.prevent="saveBed">
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Name</span>
          <input v-model="form.name" class="w-full rounded-md border border-slate-300 px-3 py-2" required />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Breite (m)</span>
          <input v-model.number="form.width" class="w-full rounded-md border border-slate-300 px-3 py-2" min="1" type="number" required />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Länge (m)</span>
          <input v-model.number="form.height" class="w-full rounded-md border border-slate-300 px-3 py-2" min="1" type="number" required />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Notizen</span>
          <textarea v-model="form.notes" class="w-full rounded-md border border-slate-300 px-3 py-2" rows="3" />
        </label>
        <div class="flex gap-2">
          <button class="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" type="submit">
            Speichern
          </button>
          <button class="rounded-full bg-slate-200 px-4 py-2 text-sm hover:bg-slate-300" type="button" @click="resetForm">
            Zurücksetzen
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
