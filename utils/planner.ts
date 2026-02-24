import type { Crop, GardenBed, PlantingRecord } from '~/types/models'
import { evaluateRotation, type RotationWarning } from '~/utils/rotation'

type PairEvaluation = {
  bedId: string
  selectionId: string
  cropId: string
  warnings: RotationWarning[]
  score: number
}

export type PlanAssignment = {
  id: string
  bedId: string
  cropId: string
  warnings: RotationWarning[]
  companionCropIds: string[]
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
  selectionId: string,
  cropId: string,
  year: number,
  crops: Crop[],
  records: PlantingRecord[]
): PairEvaluation => {
  const result = evaluateRotation(bedId, cropId, year, crops, records)
  const penalty = result.warnings.reduce((sum, warning) => sum + warningPenalty[warning.code], 0)

  return {
    bedId,
    selectionId,
    cropId,
    warnings: result.warnings,
    score: 100 - penalty
  }
}

const keyOf = (bedId: string, selectionId: string): string => `${bedId}::${selectionId}`

export const suggestBedDistribution = (
  selectedCropIds: string[],
  beds: GardenBed[],
  crops: Crop[],
  records: PlantingRecord[],
  year: number
): PlanSuggestion => {
  const selectedWithinLimit = selectedCropIds.slice(0, beds.length)
  const unassignedCropIds = selectedCropIds.slice(beds.length)

  const selectedSlots = selectedWithinLimit.map((cropId, index) => ({
    selectionId: `${cropId}#${index + 1}`,
    cropId
  }))

  if (selectedSlots.length === 0 || beds.length === 0) {
    return { assignments: [], unassignedCropIds }
  }

  const pairs = new Map<string, PairEvaluation>()
  for (const bed of beds) {
    for (const slot of selectedSlots) {
      pairs.set(keyOf(bed.id, slot.selectionId), scorePair(bed.id, slot.selectionId, slot.cropId, year, crops, records))
    }
  }

  const optionsBySelection = new Map<string, PairEvaluation[]>()
  for (const slot of selectedSlots) {
    const options = beds
      .map((bed) => pairs.get(keyOf(bed.id, slot.selectionId)))
      .filter((entry): entry is PairEvaluation => Boolean(entry))
      .sort((a, b) => b.score - a.score)
    optionsBySelection.set(slot.selectionId, options)
  }

  // Harder selections first (fewer good options) improves search quality.
  const selectionOrder = [...selectedSlots.map((slot) => slot.selectionId)].sort((a, b) => {
    const aBest = optionsBySelection.get(a)?.[0]?.score ?? -999
    const bBest = optionsBySelection.get(b)?.[0]?.score ?? -999
    return aBest - bBest
  })

  let bestScore = Number.NEGATIVE_INFINITY
  let bestAssignments: PlanAssignment[] = []
  let explored = 0
  const exploreLimit = 250000

  const backtrack = (
    selectionIdx: number,
    usedBeds: Set<string>,
    current: PlanAssignment[],
    currentScore: number
  ) => {
    explored += 1
    if (explored > exploreLimit) {
      return
    }

    if (selectionIdx >= selectionOrder.length) {
      if (currentScore > bestScore) {
        bestScore = currentScore
        bestAssignments = [...current]
      }
      return
    }

    const optimisticMax = currentScore + (selectionOrder.length - selectionIdx) * 100
    if (optimisticMax < bestScore) {
      return
    }

    const selectionId = selectionOrder[selectionIdx]
    const options = optionsBySelection.get(selectionId) ?? []

    for (const option of options) {
      if (usedBeds.has(option.bedId)) {
        continue
      }

      usedBeds.add(option.bedId)
      current.push({
        id: option.selectionId,
        bedId: option.bedId,
        cropId: option.cropId,
        warnings: option.warnings,
        companionCropIds: []
      })

      backtrack(selectionIdx + 1, usedBeds, current, currentScore + option.score)

      current.pop()
      usedBeds.delete(option.bedId)
    }
  }

  backtrack(0, new Set<string>(), [], 0)

  // Fallback if search was cut early before finding a full plan.
  if (bestAssignments.length < selectionOrder.length) {
    const usedBeds = new Set<string>()
    const greedy: PlanAssignment[] = []
    for (const selectionId of selectionOrder) {
      const pick = (optionsBySelection.get(selectionId) ?? []).find((option) => !usedBeds.has(option.bedId))
      if (!pick) {
        continue
      }
      usedBeds.add(pick.bedId)
      greedy.push({
        id: pick.selectionId,
        bedId: pick.bedId,
        cropId: pick.cropId,
        warnings: pick.warnings,
        companionCropIds: []
      })
    }
    bestAssignments = greedy
  }

  return {
    assignments: bestAssignments,
    unassignedCropIds
  }
}
