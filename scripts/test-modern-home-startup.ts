import assert from 'node:assert/strict'

import {
  DEFAULT_HOME_NAV_ID,
  getDefaultNavStatus,
  isAlwaysVisibleNavId,
  normalizeStartupNavId,
} from '../src/config/homeNav.ts'

assert.equal(DEFAULT_HOME_NAV_ID, 'nav_home')
assert.equal(normalizeStartupNavId(undefined), 'nav_home')
assert.equal(normalizeStartupNavId(null), 'nav_home')
assert.equal(normalizeStartupNavId('nav_search'), 'nav_home')
assert.equal(normalizeStartupNavId('nav_daily_rec'), 'nav_daily_rec')
assert.equal(normalizeStartupNavId('not_exists'), 'nav_home')

assert.equal(isAlwaysVisibleNavId('nav_home'), true)
assert.equal(isAlwaysVisibleNavId('nav_search'), true)
assert.equal(isAlwaysVisibleNavId('nav_setting'), true)
assert.equal(isAlwaysVisibleNavId('nav_top'), false)

const navStatus = getDefaultNavStatus()
assert.equal(navStatus.nav_home, true)
assert.equal(navStatus.nav_songlist, true)
assert.equal(navStatus.nav_my_playlist, true)

console.log('modern home startup tests passed')
