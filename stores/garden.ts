import { defineStore } from 'pinia'
import type { Crop, GardenBed, GardenData, PlantingRecord } from '~/types/models'
import { createId } from '~/utils/id'
import { evaluateRotation } from '~/utils/rotation'
import type { PlanAssignment } from '~/utils/planner'
import seedData from '~/gardenHistory.json'

export const useGardenStore = defineStore('garden', {
  state: () => ({
    beds: (seedData.gardenBeds ?? []) as GardenBed[],
    crops: (seedData.crops ?? []) as Crop[],
    records: (seedData.plantingRecords ?? []) as PlantingRecord[],
    initialized: false
  }),
  persist: true,
  getters: {
    bedById: (state) => {
      return (id: string) => state.beds.find((bed) => bed.id === id)
    },
    cropById: (state) => {
      return (id: string) => state.crops.find((crop) => crop.id === id)
    },
    recordsByBed: (state) => {
      return (bedId: string) =>
        state.records
          .filter((record) => record.bedId === bedId)
          .sort((a, b) => b.year - a.year)
    }
  },
  actions: {
    initialize() {
      if (this.initialized) {
        return
      }
      this.initialized = true
    },
    toData(): GardenData {
      return {
        gardenBeds: this.beds,
        crops: this.crops,
        plantingRecords: this.records
      }
    },
    addBed(payload: Omit<GardenBed, 'id'>) {
      this.beds.push({ ...payload, id: createId('bed') })
    },
    updateBed(id: string, payload: Omit<GardenBed, 'id'>) {
      const index = this.beds.findIndex((bed) => bed.id === id)
      if (index < 0) {
        return
      }

      this.beds[index] = { ...payload, id }
    },
    deleteBed(id: string) {
      this.beds = this.beds.filter((bed) => bed.id !== id)
      this.records = this.records.filter((record) => record.bedId !== id)
    },
    addCrop(payload: Omit<Crop, 'id'>) {
      this.crops.push({ ...payload, id: createId('crop') })
    },
    updateCrop(id: string, payload: Omit<Crop, 'id'>) {
      const index = this.crops.findIndex((crop) => crop.id === id)
      if (index < 0) {
        return
      }

      this.crops[index] = { ...payload, id }
    },
    addRecord(payload: Omit<PlantingRecord, 'id'>): boolean {
      const normalizedRole = payload.role ?? 'main'

      if (normalizedRole === 'main') {
        const hasMainInBedYear = this.records.some((record) => {
          return record.bedId === payload.bedId && record.year === payload.year && (record.role ?? 'main') === 'main'
        })

        if (hasMainInBedYear) {
          return false
        }
      }

      this.records.push({ ...payload, role: normalizedRole, id: createId('planting') })
      return true
    },
    applyYearPlan(assignments: PlanAssignment[], year: number) {
      const assignedBedIds = new Set(assignments.map((entry) => entry.bedId))
      this.records = this.records.filter((record) => !(record.year === year && assignedBedIds.has(record.bedId)))

      for (const entry of assignments) {
        this.records.push({
          id: createId('planting'),
          bedId: entry.bedId,
          cropId: entry.cropId,
          year,
          role: 'main'
        })

        for (const companionCropId of entry.companionCropIds) {
          this.records.push({
            id: createId('planting'),
            bedId: entry.bedId,
            cropId: companionCropId,
            year,
            role: 'companion'
          })
        }
      }

    },
    evaluateRotation(bedId: string, cropId: string, year: number) {
      return evaluateRotation(bedId, cropId, year, this.crops, this.records)
    },
    replaceAllData(data: GardenData) {
      this.beds = data.gardenBeds
      this.crops = data.crops
      this.records = data.plantingRecords
    }
  }
})
