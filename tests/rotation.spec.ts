import { describe, expect, it } from 'vitest'
import { evaluateRotation } from '~/utils/rotation'
import type { Crop, PlantingRecord } from '~/types/models'

const crops: Crop[] = [
  { id: 'tomato', name: 'Tomato', family: 'Solanaceae', nutrientDemand: 'high' },
  { id: 'potato', name: 'Potatoes', family: 'Solanaceae', nutrientDemand: 'high' },
  { id: 'beans', name: 'Beans', family: 'Fabaceae', nutrientDemand: 'medium' },
  { id: 'lettuce', name: 'Lettuce', family: 'Asteraceae', nutrientDemand: 'low' }
]

const records: PlantingRecord[] = [
  { id: 'r1', bedId: 'bed-1', cropId: 'tomato', year: 2024 },
  { id: 'r2', bedId: 'bed-1', cropId: 'beans', year: 2023 }
]

describe('evaluateRotation', () => {
  it('warns for same family inside 3 years', () => {
    const result = evaluateRotation('bed-1', 'potato', 2026, crops, records)
    expect(result.warnings.some((w) => w.code === 'same_family')).toBe(true)
  })

  it('warns for same nutrient demand from previous year', () => {
    const result = evaluateRotation('bed-1', 'potato', 2025, crops, records)
    expect(result.warnings.some((w) => w.code === 'same_nutrient')).toBe(true)
  })

  it('warns for incompatible combinations', () => {
    const result = evaluateRotation('bed-1', 'potato', 2025, crops, records)
    expect(result.warnings.some((w) => w.code === 'incompatible_pair')).toBe(true)
  })

  it('warns for localized incompatible combinations (Kartoffeln after Kürbis)', () => {
    const deCrops: Crop[] = [
      { id: 'kartoffeln', name: 'Kartoffeln', family: 'Solanaceae', nutrientDemand: 'high' },
      { id: 'kuerbis', name: 'Kürbis', family: 'Cucurbitaceae', nutrientDemand: 'high' }
    ]
    const deRecords: PlantingRecord[] = [
      { id: 'de-1', bedId: 'suedbeet', cropId: 'kuerbis', year: 2024 }
    ]

    const result = evaluateRotation('suedbeet', 'kartoffeln', 2025, deCrops, deRecords)
    expect(result.warnings.some((w) => w.code === 'incompatible_pair')).toBe(true)
  })

  it('recommends crop families not used in last 3 years', () => {
    const result = evaluateRotation('bed-1', 'lettuce', 2025, crops, records)
    expect(result.recommendedCropIds).toContain('lettuce')
    expect(result.recommendedCropIds).not.toContain('tomato')
  })
})
