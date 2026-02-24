export type NutrientDemand = 'low' | 'medium' | 'high'

export type GardenBed = {
  id: string
  name: string
  width: number
  height: number
  notes?: string
}

export type Crop = {
  id: string
  name: string
  family: string
  nutrientDemand: NutrientDemand
  goodNeighbors?: string[]
  badNeighbors?: string[]
}

export type PlantingRecord = {
  id: string
  bedId: string
  cropId: string
  year: number
  role?: 'main' | 'companion'
}

export type GardenData = {
  crops: Crop[]
  gardenBeds: GardenBed[]
  plantingRecords: PlantingRecord[]
}
