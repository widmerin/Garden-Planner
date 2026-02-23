import type { NutrientDemand } from '~/types/models'

export const nutrientDemandLabel = (value: NutrientDemand | string): string => {
  switch (value) {
    case 'low':
      return 'niedrig'
    case 'medium':
      return 'mittel'
    case 'high':
      return 'hoch'
    case 'niedrig':
    case 'mittel':
    case 'hoch':
      return value
    default:
      return '-'
  }
}
