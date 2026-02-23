import type { Crop, NutrientDemand, PlantingRecord } from '~/types/models'

export type RotationWarning = {
  code: 'same_family' | 'same_nutrient' | 'incompatible_pair'
  message: string
}

export type RotationResult = {
  warnings: RotationWarning[]
  recommendedCropIds: string[]
}

// Normalize free-text values (German/English, casing, umlauts) so rule matching is stable.
const normalizeKey = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Map localized nutrient labels to an internal rank used by rotation comparisons.
const nutrientRank = (demand: NutrientDemand | string): number => {
  const key = normalizeKey(String(demand))
  if (key === 'low' || key === 'niedrig') {
    return 1
  }
  if (key === 'medium' || key === 'mittel') {
    return 2
  }
  if (key === 'high' || key === 'hoch') {
    return 3
  }

  return 2
}

// Unify localized crop names to canonical keys used in incompatibility checks.
const canonicalCropName = (name: string): string => {
  const key = normalizeKey(name)

  const aliases: Record<string, string> = {
    tomato: 'tomato',
    tomate: 'tomato',
    potatoes: 'potato',
    potato: 'potato',
    kartoffeln: 'potato',
    onion: 'onion',
    zwiebel: 'onion',
    beans: 'beans',
    bohnen: 'beans',
    peas: 'peas',
    erbsen: 'peas',
    cucumber: 'cucumber',
    gurke: 'cucumber',
    pumpkin: 'pumpkin',
    kuerbis: 'pumpkin',
    kurbis: 'pumpkin'
  }

  return aliases[key] ?? key
}

const incompatibleByCanonical = new Map<string, string[]>([
  ['tomato', ['potato']],
  ['potato', ['tomato', 'pumpkin']],
  ['onion', ['beans', 'peas']],
  ['beans', ['onion']],
  ['peas', ['onion']],
  ['cucumber', ['pumpkin']],
  ['pumpkin', ['cucumber', 'potato']]
])

const getRecentBedRecords = (
  plantingRecords: PlantingRecord[],
  bedId: string,
  year: number,
  yearsBack: number
): PlantingRecord[] => {
  // Use only past records in the configured lookback window for the same bed.
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
  const recent4Years = getRecentBedRecords(plantingRecords, bedId, year, 4)
  const recent1Year = getRecentBedRecords(plantingRecords, bedId, year, 1)

  const recentCrops = recent3Years
    .map((record) => crops.find((crop) => crop.id === record.cropId))
    .filter((crop): crop is Crop => Boolean(crop))

  const recent4YearCrops = recent4Years
    .map((record) => crops.find((crop) => crop.id === record.cropId))
    .filter((crop): crop is Crop => Boolean(crop))

  const lastYearCrops = recent1Year
    .map((record) => crops.find((crop) => crop.id === record.cropId))
    .filter((crop): crop is Crop => Boolean(crop))

  const warnings: RotationWarning[] = []

  // Rule 1: same family should not return to the same bed within 3 years.
  const sameFamilyCrop = recentCrops.find((crop) => crop.family === targetCrop.family)
  if (sameFamilyCrop) {
    warnings.push({
      code: 'same_family',
      message: `Familienkonflikt: ${targetCrop.family} wurde in diesem Beet in den letzten 3 Jahren bereits angebaut.`
    })
  }

  // Rule 2 (user-specific): warn only if a new high-demand crop follows
  // any high-demand crop in the same bed within the last 4 years.
  const isHighDemandTarget = nutrientRank(targetCrop.nutrientDemand) === 3
  const hadHighDemandInLast4Years = recent4YearCrops.some((crop) => nutrientRank(crop.nutrientDemand) === 3)
  if (isHighDemandTarget && hadHighDemandInLast4Years) {
    warnings.push({
      code: 'same_nutrient',
      message: `Nährstoff-Warnung: ${targetCrop.name} hat einen hohen Nährstoffbedarf und in diesem Beet wurde in den letzten 4 Jahren bereits eine Kultur mit hohem Bedarf angebaut.`
    })
  }

  // Rule 3: detect configured incompatible crop sequences.
  const incompatibleNames = incompatibleByCanonical.get(canonicalCropName(targetCrop.name)) ?? []
  const incompatibleMatch = recentCrops.find((crop) => incompatibleNames.includes(canonicalCropName(crop.name)))
  if (incompatibleMatch) {
    warnings.push({
      code: 'incompatible_pair',
      message: `Unverträgliche Fruchtfolge: ${targetCrop.name} folgt in diesem Beet zu früh auf ${incompatibleMatch.name}.`
    })
  }

  const recommendedCropIds = crops
    .filter((crop) => {
      // Don't recommend blocked families from the recent 3-year window.
      const familyBlocked = recentCrops.some((recentCrop) => recentCrop.family === crop.family)
      if (familyBlocked) {
        return false
      }

      if (lastYearCrops.length === 0) {
        return true
      }

      // Prefer crops with equal or lower demand than the previous year average.
      const avgLastYearDemand =
        lastYearCrops.reduce((sum, recent) => sum + nutrientRank(recent.nutrientDemand), 0) / lastYearCrops.length
      const cropDemand = nutrientRank(crop.nutrientDemand)

      return cropDemand <= avgLastYearDemand
    })
    .slice(0, 6)
    .map((crop) => crop.id)

  return { warnings, recommendedCropIds }
}
