import { memoryPublicPath } from '../utils/memoryAssetPath'

/**
 * @typedef {'image' | 'video' | 'text'} MediaType
 * @typedef {'emotion' | 'vision' | 'hearing' | 'memory' | 'decision'} RegionId
 *
 * @typedef {Object} Memory
 * @property {string} id
 * @property {string} title
 * @property {MediaType} mediaType
 * @property {string | null} filePath
 * @property {RegionId} primaryRegion
 * @property {RegionId[]} secondaryRegions
 * @property {string[]} emotionalTags
 * @property {string} description
 * @property {string} [body]
 * @property {boolean} [injected]
 * @property {string} [mediaKey]
 */

export const BRAIN_REGION_IDS = [
  'emotion',
  'vision',
  'hearing',
  'memory',
  'decision',
]

/** Built-in seed memories shipped with the experience. */
export const SEED_MEMORIES = [
  {
    id: 'childhood-light',
    title: 'childhood light',
    mediaType: 'image',
    filePath: memoryPublicPath('childhood.jpg'),
    primaryRegion: 'memory',
    secondaryRegions: ['emotion', 'vision'],
    emotionalTags: ['nostalgia', 'tenderness', 'home'],
    description:
      'A room where time moved slowly, and the world was still learning your name.',
  },
  {
    id: 'second-birthday',
    title: 'second birthday',
    mediaType: 'image',
    filePath: memoryPublicPath('2birthday.jpg'),
    primaryRegion: 'emotion',
    secondaryRegions: ['memory', 'decision'],
    emotionalTags: ['joy', 'innocence', 'gathering'],
    description:
      'Cake smoke and small hands reaching — the first applause of being alive.',
  },
  {
    id: 'summer-home',
    title: 'summer home',
    mediaType: 'image',
    filePath: memoryPublicPath('summerhome.jpg'),
    primaryRegion: 'memory',
    secondaryRegions: ['emotion', 'hearing'],
    emotionalTags: ['belonging', 'warmth', 'distance'],
    description:
      'Walls that held laughter like weather — you can still hear the rooms breathing.',
  },
  {
    id: 'blue-hour',
    title: 'blue hour',
    mediaType: 'image',
    filePath: memoryPublicPath('bluehour.jpg'),
    primaryRegion: 'vision',
    secondaryRegions: ['emotion', 'decision'],
    emotionalTags: ['longing', 'stillness', 'threshold'],
    description:
      'The sky pauses between day and night — a color for things not yet named.',
  },
  {
    id: 'sunshine-classroom',
    title: 'sunshine classroom',
    mediaType: 'video',
    filePath: memoryPublicPath('sunshineclassroom.MOV'),
    primaryRegion: 'hearing',
    secondaryRegions: ['vision', 'memory'],
    emotionalTags: ['youth', 'rhythm', 'communion'],
    description:
      'Dust in light, voices overlapping — memory as movement, not photograph.',
  },
  {
    id: 'dali-with-leni',
    title: 'dali with leni',
    mediaType: 'video',
    filePath: memoryPublicPath('DaliwithLeni.MOV'),
    primaryRegion: 'vision',
    secondaryRegions: ['emotion', 'hearing', 'memory'],
    emotionalTags: ['companionship', 'laughter', 'present'],
    description:
      'Two figures in the same frame of time — love recorded without trying.',
  },
  {
    id: 'unspoken-yes',
    title: 'unspoken yes',
    mediaType: 'text',
    filePath: null,
    primaryRegion: 'decision',
    secondaryRegions: ['emotion'],
    emotionalTags: ['resolve', 'quiet', 'turning'],
    description:
      'The choice arrived before language — a tilt of the heart toward tomorrow.',
    body: 'I did not debate. Something older than reason leaned forward, and the path opened as if it had been waiting.',
  },
  {
    id: 'peripheral-echo',
    title: 'peripheral echo',
    mediaType: 'text',
    filePath: null,
    primaryRegion: 'hearing',
    secondaryRegions: ['memory'],
    emotionalTags: ['echo', 'absence', 'trace'],
    description:
      'A sound you cannot place — only the feeling that someone was once near.',
    body: 'Not a melody, not words — the acoustic shadow of a room where you were loved without knowing it yet.',
  },
]

export function getAllRegionsForMemory(memory) {
  return [memory.primaryRegion, ...memory.secondaryRegions]
}

export function isPrimaryInRegion(memory, regionId) {
  return memory.primaryRegion === regionId
}

export function isSecondaryInRegion(memory, regionId) {
  return memory.secondaryRegions.includes(regionId)
}

export function isLinkedToRegion(memory, regionId) {
  return isPrimaryInRegion(memory, regionId) || isSecondaryInRegion(memory, regionId)
}

export function getPrimaryMemoriesForRegion(memories, regionId) {
  return memories.filter((m) => m.primaryRegion === regionId)
}

export function getSecondaryMemoriesForRegion(memories, regionId) {
  return memories.filter((m) => isSecondaryInRegion(m, regionId))
}

export function getArchiveForRegion(memories, regionId) {
  const primary = getPrimaryMemoriesForRegion(memories, regionId)
  const secondary = getSecondaryMemoriesForRegion(memories, regionId)
  return { primary, secondary }
}

export function getMemoriesForRegion(memories, regionId) {
  return memories.filter((m) => isLinkedToRegion(m, regionId))
}

export function findMemoryById(memories, memoryId) {
  return memories.find((m) => m.id === memoryId) ?? null
}

export function getArchiveList(memories, filterRegionId = null) {
  if (!filterRegionId) {
    const primary = [...memories].sort((a, b) => {
      if (a.injected !== b.injected) return a.injected ? 1 : -1
      return a.title.localeCompare(b.title)
    })
    return { primary, secondary: [] }
  }
  return getArchiveForRegion(memories, filterRegionId)
}

export function inferMediaTypeFromFile(file) {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  const name = file.name.toLowerCase()
  if (/\.(mp4|mov|webm|ogg|m4v)$/.test(name)) return 'video'
  if (/\.(jpe?g|png|gif|webp|avif|heic)$/.test(name)) return 'image'
  return null
}

export function deriveTitleFromText(text) {
  const line = text.trim().split(/\n/)[0]?.trim() ?? ''
  if (!line) return 'untitled fragment'
  return line.length > 48 ? `${line.slice(0, 45)}…` : line
}
