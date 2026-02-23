import type { Crop, NutrientDemand, PlantingRecord } from '~/types/models'
import { nutrientDemandLabel } from '~/utils/labels'

export type RotationWarning = {
  code: 'same_family' | 'same_nutrient' | 'incompatible_pair'
  message: string
}

export type RotationResult = {
  warnings: RotationWarning[]
  recommendedCropIds: string[]
}

const nutrientRank: Record<NutrientDemand, number> = {
  low: 1,
  medium: 2,
  high: 3
}

const incompatibleByName = new Map<string, string[]>([
  ['Tomato', ['Potatoes']],
  ['Potatoes', ['Tomato']],
  ['Onion', ['Beans', 'Peas']],
  ['Beans', ['Onion']],
  ['Peas', ['Onion']],
  ['Cucumber', ['Pumpkin']],
  ['Pumpkin', ['Cucumber']]
])

const getRecentBedRecords = (
  plantingRecords: PlantingRecord[],
  bedId: string,
  year: number,
  yearsBack: number
): PlantingRecord[] => {
  return plantingRecords.filter((record) => {
    const diff = year - record.year
    return record.bedId === bedId && diff > 0 && diff <= yearsBack
  })
}

export const evaluateRotation = (
  bedId: string,
  cropId: string,
  year: number,
  crops: Crop[],
  plantingRecords: PlantingRecord[]
): RotationResult => {
  const targetCrop = crops.find((crop) => crop.id === cropId)

  if (!targetCrop) {
    return { warnings: [], recommendedCropIds: [] }
  }

  const recent3Years = getRecentBedRecords(plantingRecords, bedId, year, 3)
  const recent1Year = getRecentBedRecords(plantingRecords, bedId, year, 1)

  const recentCrops = recent3Years
    .map((record) => crops.find((crop) => crop.id === record.cropId))
    .filter((crop): crop is Crop => Boolean(crop))

  const lastYearCrops = recent1Year
    .map((record) => crops.find((crop) => crop.id === record.cropId))
    .filter((crop): crop is Crop => Boolean(crop))

  const warnings: RotationWarning[] = []

  const sameFamilyCrop = recentCrops.find((crop) => crop.family === targetCrop.family)
  if (sameFamilyCrop) {
    warnings.push({
      code: 'same_family',
      message: `Familienkonflikt: ${targetCrop.family} wurde in diesem Beet in den letzten 3 Jahren bereits angebaut.`
    })
  }

  const sameNutrientCrop = lastYearCrops.find((crop) => crop.nutrientDemand === targetCrop.nutrientDemand)
  if (sameNutrientCrop) {
    warnings.push({
      code: 'same_nutrient',
      message: `Nährstoff-Warnung: Bedarf „${nutrientDemandLabel(targetCrop.nutrientDemand)}“ wurde in diesem Beet im letzten Jahr bereits genutzt.`
    })
  }

  const incompatibleNames = incompatibleByName.get(targetCrop.name) ?? []
  const incompatibleMatch = recentCrops.find((crop) => incompatibleNames.includes(crop.name))
  if (incompatibleMatch) {
    warnings.push({
      code: 'incompatible_pair',
      message: `Unverträgliche Fruchtfolge: ${targetCrop.name} folgt in diesem Beet zu früh auf ${incompatibleMatch.name}.`
    })
  }

  const recommendedCropIds = crops
    .filter((crop) => {
      const familyBlocked = recentCrops.some((recentCrop) => recentCrop.family === crop.family)
      if (familyBlocked) {
        return false
      }

      if (lastYearCrops.length === 0) {
        return true
      }

      const avgLastYearDemand =
        lastYearCrops.reduce((sum, recent) => sum + nutrientRank[recent.nutrientDemand], 0) / lastYearCrops.length
      const cropDemand = nutrientRank[crop.nutrientDemand]

      return cropDemand <= avgLastYearDemand
    })
    .slice(0, 6)
    .map((crop) => crop.id)

  return { warnings, recommendedCropIds }
}
