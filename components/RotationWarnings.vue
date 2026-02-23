<script setup lang="ts">
import type { Crop } from '~/types/models'
import type { RotationWarning } from '~/utils/rotation'

defineProps<{
  warnings: RotationWarning[]
  recommendedCrops: Crop[]
}>()
</script>

<template>
  <div class="space-y-3">
    <div v-if="warnings.length" class="rounded-xl border border-amber-300 bg-amber-50 p-3">
      <h3 class="mb-2 text-sm font-semibold text-amber-900">⚠️ Fruchtfolge-Warnungen</h3>
      <ul class="list-disc space-y-1 pl-5 text-sm text-amber-800">
        <li v-for="warning in warnings" :key="warning.code + warning.message">{{ warning.message }}</li>
      </ul>
    </div>

    <div class="rounded-xl border border-emerald-300 bg-emerald-50 p-3">
      <h3 class="mb-2 text-sm font-semibold text-emerald-900">✅ Empfohlene nächste Kulturen</h3>
      <p v-if="!recommendedCrops.length" class="text-sm text-emerald-800">Keine klare Empfehlung aus der aktuellen Historie.</p>
      <div v-else class="flex flex-wrap gap-2">
        <span
          v-for="crop in recommendedCrops"
          :key="crop.id"
          class="rounded-full bg-emerald-200 px-3 py-1 text-xs font-medium text-emerald-900"
        >
          {{ crop.name }}
        </span>
      </div>
    </div>
  </div>
</template>
