export const DEFAULT_HOME_NAV_ID = 'nav_home' as const

export const NAV_MENUS = [
  { id: 'nav_home', icon: 'home' },
  { id: 'nav_search', icon: 'search-2' },
  { id: 'nav_songlist', icon: 'album' },
  { id: 'nav_top', icon: 'leaderboard' },
  { id: 'nav_love', icon: 'love' },
  { id: 'nav_daily_rec', icon: 'love' },
  { id: 'nav_followed_artists', icon: 'love' },
  { id: 'nav_subscribed_albums', icon: 'album' },
  { id: 'nav_my_playlist', icon: 'album' },
  { id: 'nav_setting', icon: 'setting' },
] as const

export type NAV_ID_Type = (typeof NAV_MENUS)[number]['id']

const ALWAYS_VISIBLE_NAV_IDS = new Set<NAV_ID_Type>(['nav_home', 'nav_search', 'nav_setting'])
const VALID_NAV_IDS = new Set<string>(NAV_MENUS.map(({ id }) => id))

export const isAlwaysVisibleNavId = (id: NAV_ID_Type | string) =>
  ALWAYS_VISIBLE_NAV_IDS.has(id as NAV_ID_Type)

export const getDefaultNavStatus = (): Partial<Record<NAV_ID_Type, boolean>> => ({
  nav_home: true,
  nav_search: true,
  nav_songlist: true,
  nav_top: true,
  nav_love: true,
  nav_daily_rec: true,
  nav_my_playlist: true,
  nav_followed_artists: true,
  nav_subscribed_albums: true,
  nav_setting: true,
})

export const normalizeStartupNavId = (id?: string | null): NAV_ID_Type => {
  if (!id) return DEFAULT_HOME_NAV_ID
  if (id === 'nav_search') return DEFAULT_HOME_NAV_ID
  if (!VALID_NAV_IDS.has(id)) return DEFAULT_HOME_NAV_ID
  return id as NAV_ID_Type
}
