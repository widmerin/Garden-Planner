import { describe, expect, it } from 'vitest'
import { evaluateCompanionFit, mainAndCompanionForBedYear, sortCompanionCandidates } from '~/utils/companions'
import type { Crop, PlantingRecord } from '~/types/models'

const crops: Crop[] = [
  {
    id: 'tomate',
    name: 'Tomate',
    family: 'Solanaceae',
    nutrientDemand: 'high',
    goodNeighbors: ['Karotte'],
    badNeighbors: ['Kartoffeln']
  },
  { id: 'karotte', name: 'Karotte', family: 'Apiaceae', nutrientDemand: 'medium' },
  { id: 'kartoffeln', name: 'Kartoffeln', family: 'Solanaceae', nutrientDemand: 'high' }
]

describe('companions', () => {
  it('scores good neighbors above bad neighbors', () => {
    const main = crops[0]
    const good = crops[1]
    const bad = crops[2]

    expect(evaluateCompanionFit(main, good).score).toBeGreaterThan(evaluateCompanionFit(main, bad).score)
  })

  it('sorts best companion first', () => {
    const ordered = sortCompanionCandidates(crops[0], crops, new Set(['tomate']))
    expect(ordered[0].id).toBe('karotte')
  })

  it('picks explicit main role for bed/year and returns companions', () => {
    const records: PlantingRecord[] = [
      { id: 'r1', bedId: 'b1', cropId: 'karotte', year: 2026, role: 'companion' },
      { id: 'r2', bedId: 'b1', cropId: 'tomate', year: 2026, role: 'main' }
    ]

    const result = mainAndCompanionForBedYear(records, 'b1', 2026)
    expect(result.mainRecord?.cropId).toBe('tomate')
    expect(result.companionRecords).toHaveLength(1)
  })
})
