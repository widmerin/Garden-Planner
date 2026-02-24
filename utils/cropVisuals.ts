import type { Crop } from '~/types/models'

const normalizeKey = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const cropIcons: Record<string, string> = {
  tomato: '🍅',
  tomate: '🍅',
  pepper: '🫑',
  paprika: '🫑',
  potato: '🥔',
  potatoes: '🥔',
  kartoffeln: '🥔',
  carrot: '🥕',
  karotte: '🥕',
  cucumber: '🥒',
  gurke: '🥒',
  zucchini: '🥒',
  pumpkin: '🎃',
  kuerbis: '🎃',
  kurbis: '🎃',
  lettuce: '🥬',
  salat: '🥬',
  onion: '🧅',
  zwiebel: '🧅',
  radish: '🌶️',
  radieschen: '🌶️',
  peas: '🫛',
  erbsen: '🫛',
  beans: '🫘',
  bohnen: '🫘',
  kale: '🥬',
  gruenkohl: '🥬',
  grunkohl: '🥬',
  spinach: '🥬',
  spinat: '🥬',
  parsley: '🌿',
  petersilie: '🌿',
  basil: '🌿',
  basilikum: '🌿',
  kohlrabi: '🥬',
  beetroot: '🫜',
  rotebeete: '🫜',
  celery: '🥬',
  sellerie: '🥬',
  swisschard: '🥬',
  mangold: '🥬'
}

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

  const byName = cropIcons[normalizeKey(crop.name).replace(/\s+/g, '')]
  if (byName) {
    return byName
  }

  return familyIcons[crop.family] ?? '🌱'
}
