import type { GardenData } from '~/types/models'
import seedData from "~/gardenHistory.json";

const STORAGE_KEY = 'garden-planner:v1'

const parseData = (raw: unknown): GardenData | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const candidate = raw as Partial<GardenData>
  if (!Array.isArray(candidate.crops) || !Array.isArray(candidate.gardenBeds) || !Array.isArray(candidate.plantingRecords)) {
    return null
  }

  return {
    crops: candidate.crops,
    gardenBeds: candidate.gardenBeds,
    plantingRecords: candidate.plantingRecords
  } as GardenData
}

export const useGardenStorage = () => {
  const load = (): GardenData => {
    if (!import.meta.client) {
      return seedData as GardenData
    }

    const persisted = localStorage.getItem(STORAGE_KEY)
    if (!persisted) {
      return seedData as GardenData
    }

    try {
      const parsed = JSON.parse(persisted)
      return parseData(parsed) ?? (seedData as GardenData)
    } catch {
      return seedData as GardenData
    }
  }

  const save = (data: GardenData): void => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const exportJson = (data: GardenData): string => JSON.stringify(data, null, 2)

  const importJson = (json: string): GardenData | null => {
    try {
      const parsed = JSON.parse(json)
      return parseData(parsed)
    } catch {
      return null
    }
  }

  return { load, save, exportJson, importJson }
}
