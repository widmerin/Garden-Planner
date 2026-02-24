<script setup lang="ts">
const store = useGardenStore()
store.initialize()

const storage = useGardenStorage()
const importText = ref('')
const message = ref('')

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
</script>

<template>
  <section class="space-y-6">
    <div class="card-soft p-4">
      <h2 class="text-xl font-semibold text-emerald-900">Import & Export</h2>
      <p class="mt-1 text-sm text-slate-600">Sichere alle Daten als JSON-Backup oder stelle sie aus einem Backup wieder her.</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="card-soft p-4">
        <h3 class="mb-3 text-xl font-semibold">Export</h3>
        <p class="mb-4 text-sm text-slate-600">Lade ein vollständiges Backup von Beeten, Kulturen und Pflanzhistorie herunter.</p>
        <button class="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" @click="downloadExport">
          JSON exportieren
        </button>
      </div>

      <div class="card-soft p-4">
        <h3 class="mb-3 text-xl font-semibold">Import</h3>
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
  </section>
</template>
