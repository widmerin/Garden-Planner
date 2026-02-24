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

const roleLabel = (role: string | undefined): string => {
  if (role === 'companion') {
    return 'Nebenkultur'
  }
  return 'Hauptkultur'
}

const roleClass = (role: string | undefined): string => {
  if (role === 'companion') {
    return 'border-sky-200 bg-sky-50 text-sky-800'
  }
  return 'border-emerald-200 bg-emerald-50 text-emerald-800'
}

</script>

<template>
  <div class="card-soft p-4">
    <h3 class="mb-3 text-lg font-semibold">Pflanzhistorie (5 Jahre)</h3>

    <div class="space-y-2 md:hidden">
      <article
        v-for="record in records"
        :key="`mobile-${record.id}`"
        class="rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="text-sm font-semibold text-slate-700">{{ record.year }}</span>
          <span class="chip-crop">
            <span>{{ cropIcon(cropById.get(record.cropId)) }}</span>
            <span>{{ cropById.get(record.cropId)?.name ?? 'Unbekannt' }}</span>
          </span>
        </div>
        <p class="text-xs text-slate-600">Familie: {{ cropById.get(record.cropId)?.family ?? '-' }}</p>
        <p class="text-xs text-slate-600">Nährstoffbedarf: {{ nutrientDemandForRecord(record.cropId) }}</p>
        <p class="mt-1">
          <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold" :class="roleClass(record.role)">
            {{ roleLabel(record.role) }}
          </span>
        </p>
      </article>
    </div>

    <div class="hidden overflow-x-auto md:block">
      <table class="w-full border-collapse text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200 text-slate-600">
          <th class="pb-2">Jahr</th>
          <th class="pb-2">Kultur</th>
          <th class="pb-2">Familie</th>
          <th class="pb-2">Nährstoffbedarf</th>
          <th class="pb-2">Typ</th>
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
          <td class="py-2">
            <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold" :class="roleClass(record.role)">
              {{ roleLabel(record.role) }}
            </span>
          </td>
        </tr>
      </tbody>
      </table>
    </div>
  </div>
</template>
