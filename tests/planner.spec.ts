import { describe, expect, it } from 'vitest'
import { suggestBedDistribution } from '~/utils/planner'
import type { Crop, GardenBed, PlantingRecord } from '~/types/models'

const beds: GardenBed[] = [
  { id: 'b1', name: 'Nord', width: 2, height: 2 },
  { id: 'b2', name: 'Sued', width: 2, height: 2 }
]

const crops: Crop[] = [
  { id: 'c1', name: 'Tomate', family: 'Solanaceae', nutrientDemand: 'high' },
  { id: 'c2', name: 'Salat', family: 'Asteraceae', nutrientDemand: 'low' },
  { id: 'c3', name: 'Kuerbis', family: 'Cucurbitaceae', nutrientDemand: 'high' }
]

const records: PlantingRecord[] = [
  { id: 'p1', bedId: 'b1', cropId: 'c1', year: 2024 }
]

describe('suggestBedDistribution', () => {
  it('creates one-bed-per-crop suggestions', () => {
    const result = suggestBedDistribution(['c1', 'c2'], beds, crops, records, 2026)
    expect(result.assignments).toHaveLength(2)
    expect(new Set(result.assignments.map((entry) => entry.bedId)).size).toBe(2)
  })

  it('supports selecting the same crop multiple times', () => {
    const result = suggestBedDistribution(['c2', 'c2'], beds, crops, records, 2026)
    expect(result.assignments).toHaveLength(2)
    expect(result.assignments.every((entry) => entry.cropId === 'c2')).toBe(true)
  })

  it('returns overflow crops as unassigned when more crops than beds are selected', () => {
    const result = suggestBedDistribution(['c1', 'c2', 'c3'], beds, crops, records, 2026)
    expect(result.unassignedCropIds).toHaveLength(1)
  })
})
