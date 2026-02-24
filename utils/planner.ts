import type { Crop, GardenBed, PlantingRecord } from '~/types/models'
import { evaluateRotation, type RotationWarning } from '~/utils/rotation'

type PairEvaluation = {
  bedId: string
  cropId: string
  warnings: RotationWarning[]
  score: number
}

export type PlanAssignment = {
  bedId: string
  cropId: string
  warnings: RotationWarning[]
}

export type PlanSuggestion = {
  assignments: PlanAssignment[]
  unassignedCropIds: string[]
}

const warningPenalty: Record<RotationWarning['code'], number> = {
  same_family: 7,
  incompatible_pair: 6,
  same_nutrient: 3
}

const scorePair = (
  bedId: string,
  cropId: string,
  year: number,
  crops: Crop[],
  records: PlantingRecord[]
): PairEvaluation => {
  const result = evaluateRotation(bedId, cropId, year, crops, records)
  const penalty = result.warnings.reduce((sum, warning) => sum + warningPenalty[warning.code], 0)

  return {
    bedId,
    cropId,
    warnings: result.warnings,
    score: 100 - penalty
  }
}

const keyOf = (bedId: string, cropId: string): string => `${bedId}::${cropId}`

export const suggestBedDistribution = (
  selectedCropIds: string[],
  beds: GardenBed[],
  crops: Crop[],
  records: PlantingRecord[],
  year: number
): PlanSuggestion => {
  const uniqueSelected = Array.from(new Set(selectedCropIds))
  const selectedWithinLimit = uniqueSelected.slice(0, beds.length)
  const unassignedCropIds = uniqueSelected.slice(beds.length)

  if (selectedWithinLimit.length === 0 || beds.length === 0) {
    return { assignments: [], unassignedCropIds }
  }

  const pairs = new Map<string, PairEvaluation>()
  for (const bed of beds) {
    for (const cropId of selectedWithinLimit) {
      pairs.set(keyOf(bed.id, cropId), scorePair(bed.id, cropId, year, crops, records))
    }
  }

  const optionsByCrop = new Map<string, PairEvaluation[]>()
  for (const cropId of selectedWithinLimit) {
    const options = beds
      .map((bed) => pairs.get(keyOf(bed.id, cropId)))
      .filter((entry): entry is PairEvaluation => Boolean(entry))
      .sort((a, b) => b.score - a.score)
    optionsByCrop.set(cropId, options)
  }

  // Harder crops first (fewer good options) improves search quality.
  const cropOrder = [...selectedWithinLimit].sort((a, b) => {
    const aBest = optionsByCrop.get(a)?.[0]?.score ?? -999
    const bBest = optionsByCrop.get(b)?.[0]?.score ?? -999
    return aBest - bBest
  })

  let bestScore = Number.NEGATIVE_INFINITY
  let bestAssignments: PlanAssignment[] = []
  let explored = 0
  const exploreLimit = 250000

  const backtrack = (
    cropIdx: number,
    usedBeds: Set<string>,
    current: PlanAssignment[],
    currentScore: number
  ) => {
    explored += 1
    if (explored > exploreLimit) {
      return
    }

    if (cropIdx >= cropOrder.length) {
      if (currentScore > bestScore) {
        bestScore = currentScore
        bestAssignments = [...current]
      }
      return
    }

    const optimisticMax = currentScore + (cropOrder.length - cropIdx) * 100
    if (optimisticMax < bestScore) {
      return
    }

    const cropId = cropOrder[cropIdx]
    const options = optionsByCrop.get(cropId) ?? []

    for (const option of options) {
      if (usedBeds.has(option.bedId)) {
        continue
      }

      usedBeds.add(option.bedId)
      current.push({
        bedId: option.bedId,
        cropId: option.cropId,
        warnings: option.warnings
      })

      backtrack(cropIdx + 1, usedBeds, current, currentScore + option.score)

      current.pop()
      usedBeds.delete(option.bedId)
    }
  }

  backtrack(0, new Set<string>(), [], 0)

  // Fallback if search was cut early before finding a full plan.
  if (bestAssignments.length < cropOrder.length) {
    const usedBeds = new Set<string>()
    const greedy: PlanAssignment[] = []
    for (const cropId of cropOrder) {
      const pick = (optionsByCrop.get(cropId) ?? []).find((option) => !usedBeds.has(option.bedId))
      if (!pick) {
        continue
      }
      usedBeds.add(pick.bedId)
      greedy.push({ bedId: pick.bedId, cropId: pick.cropId, warnings: pick.warnings })
    }
    bestAssignments = greedy
  }

  return {
    assignments: bestAssignments,
    unassignedCropIds
  }
}
