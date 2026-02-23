import type { Crop } from '~/types/models'

const familyIcons: Record<string, string> = {
  Solanaceae: '🍅',
  Cucurbitaceae: '🥒',
  Apiaceae: '🥕',
  Brassicaceae: '🥬',
  Fabaceae: '🫛',
  Amaryllidaceae: '🧅',
  Amaranthaceae: '🌿',
  Asteraceae: '🥗',
  Lamiaceae: '🌱'
}

export const cropIcon = (crop?: Crop): string => {
  if (!crop) {
    return '🌾'
  }

  return familyIcons[crop.family] ?? '🌱'
}
