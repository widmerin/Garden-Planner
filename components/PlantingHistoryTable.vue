<script setup lang="ts">
import type { Crop, PlantingRecord } from '~/types/models'
import { cropIcon } from '~/utils/cropVisuals'
import { nutrientDemandLabel } from '~/utils/labels'

const props = defineProps<{
  records: PlantingRecord[]
  crops: Crop[]
}>()

const cropById = computed(() => {
  return new Map(props.crops.map((crop) => [crop.id, crop]))
})

const nutrientDemandForRecord = (cropId: string): string => {
  const crop = cropById.value.get(cropId)
  return crop ? nutrientDemandLabel(crop.nutrientDemand) : '-'
}
</script>

<template>
  <div class="card-soft overflow-x-auto p-4">
    <h3 class="mb-3 text-lg font-semibold">Pflanzhistorie (5 Jahre)</h3>
    <table class="w-full border-collapse text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200 text-slate-600">
          <th class="pb-2">Jahr</th>
          <th class="pb-2">Kultur</th>
          <th class="pb-2">Familie</th>
          <th class="pb-2">Nährstoffbedarf</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record.id" class="border-b border-slate-100 last:border-0">
          <td class="py-2">{{ record.year }}</td>
          <td class="py-2">
            <span class="chip-crop">
              <span>{{ cropIcon(cropById.get(record.cropId)) }}</span>
              <span>{{ cropById.get(record.cropId)?.name ?? 'Unbekannt' }}</span>
            </span>
          </td>
          <td class="py-2">{{ cropById.get(record.cropId)?.family ?? '-' }}</td>
          <td class="py-2">{{ nutrientDemandForRecord(record.cropId) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
