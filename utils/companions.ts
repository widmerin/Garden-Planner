import type { Crop, NutrientDemand, PlantingRecord } from '~/types/models'

export type CompanionFit = {
  score: number
  reasons: string[]
  conflicts: string[]
}

const normalizeKey = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

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

const matchesNeighborTerm = (term: string, crop: Crop): boolean => {
  const termKey = normalizeKey(term)
  const cropNameKey = normalizeKey(crop.name)

  if (termKey === cropNameKey) {
    return true
  }

  if (termKey === 'kohl' || termKey === 'kohlsorten' || termKey === 'andere kohlsorten') {
    return normalizeKey(crop.family) === 'brassicaceae'
  }

  if (termKey === 'kopfsalat' || termKey === 'salat') {
    return cropNameKey.includes('salat')
  }

  if (termKey === 'stangenbohne' || termKey === 'stangenbohnen') {
    return cropNameKey.includes('bohne')
  }

  if (termKey === 'mais') {
    return cropNameKey.includes('mais')
  }

  if (termKey === 'rote beete' || termKey === 'randen') {
    return cropNameKey.includes('rote beete') || cropNameKey === 'randen'
  }

  return false
}

const inList = (list: string[] | undefined, crop: Crop): boolean => {
  if (!list || list.length === 0) {
    return false
  }

  return list.some((entry) => matchesNeighborTerm(entry, crop))
}

// LANDI companion data is directional in places. We combine both sides so
// recommendations are robust even when only one crop has explicit lists.
export const evaluateCompanionFit = (mainCrop: Crop, candidateCrop: Crop): CompanionFit => {
  if (mainCrop.id === candidateCrop.id) {
    return {
      score: -999,
      reasons: [],
      conflicts: [`${candidateCrop.name} ist bereits als Hauptkultur gesetzt.`]
    }
  }

  const reasons: string[] = []
  const conflicts: string[] = []
  let score = 0

  if (inList(mainCrop.goodNeighbors, candidateCrop)) {
    score += 5
    reasons.push(`Gute Kombination mit ${mainCrop.name}`)
  }
  if (inList(candidateCrop.goodNeighbors, mainCrop)) {
    score += 3
    reasons.push(`Gute Kombination laut ${candidateCrop.name}`)
  }

  if (inList(mainCrop.badNeighbors, candidateCrop)) {
    score -= 8
    conflicts.push(`${mainCrop.name} und ${candidateCrop.name} gelten als schlechte Nachbarn`)
  }
  if (inList(candidateCrop.badNeighbors, mainCrop)) {
    score -= 6
    conflicts.push(`${candidateCrop.name} und ${mainCrop.name} gelten als schlechte Nachbarn`)
  }

  if (mainCrop.family === candidateCrop.family) {
    score -= 2
    conflicts.push(`Gleiche Pflanzenfamilie (${mainCrop.family})`)
  }

  const demandDelta = Math.abs(nutrientRank(mainCrop.nutrientDemand) - nutrientRank(candidateCrop.nutrientDemand))
  if (demandDelta >= 2) {
    score -= 1
  }

  return { score, reasons, conflicts }
}

export const sortCompanionCandidates = (
  mainCrop: Crop,
  crops: Crop[],
  excludedCropIds: Set<string>
): Crop[] => {
  return [...crops]
    .filter((crop) => !excludedCropIds.has(crop.id))
    .sort((a, b) => {
      const fitA = evaluateCompanionFit(mainCrop, a)
      const fitB = evaluateCompanionFit(mainCrop, b)
      if (fitB.score !== fitA.score) {
        return fitB.score - fitA.score
      }
      return a.name.localeCompare(b.name, 'de')
    })
}

export const companionConflictWarnings = (mainCrop: Crop, companionCrops: Crop[]): string[] => {
  const warnings: string[] = []

  for (const companion of companionCrops) {
    const fit = evaluateCompanionFit(mainCrop, companion)
    for (const conflict of fit.conflicts) {
      warnings.push(`Mischkultur-Warnung: ${conflict}.`)
    }
  }

  for (let idx = 0; idx < companionCrops.length; idx += 1) {
    for (let jdx = idx + 1; jdx < companionCrops.length; jdx += 1) {
      const left = companionCrops[idx]
      const right = companionCrops[jdx]
      const fit = evaluateCompanionFit(left, right)
      for (const conflict of fit.conflicts) {
        warnings.push(`Mischkultur-Warnung: ${conflict}.`)
      }
    }
  }

  return [...new Set(warnings)]
}

export const mainAndCompanionForBedYear = (
  records: PlantingRecord[],
  bedId: string,
  year: number
): { mainRecord: PlantingRecord | null; companionRecords: PlantingRecord[] } => {
  const matches = records.filter((record) => record.bedId === bedId && record.year === year)
  if (matches.length === 0) {
    return { mainRecord: null, companionRecords: [] }
  }

  const explicitMain = matches.find((record) => record.role === 'main') ?? null
  const inferredMain = explicitMain ?? matches[0]
  const companions = matches.filter((record) => record !== inferredMain)

  return { mainRecord: inferredMain, companionRecords: companions }
}
