import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMPAIGN_STORAGE_KEY,
  campaignStorageKey,
  commitCampaignlessTransfer,
  createCampaign,
  createCampaignId,
  createCampaignStorage,
  deleteCampaign,
  loadCampaignState,
  normalizeCampaignName,
  normalizeCampaignState,
  removeCampaignData,
  renameCampaign,
  saveCampaignState,
  searchCampaigns,
  selectCampaign,
} from '../src/campaigns.js';
import { HISTORY_STORAGE_KEY, loadHistory } from '../src/history.js';
import { PRESET_STORAGE_KEY, loadPresets } from '../src/presets.js';

function createMemoryStorage(initial = {}, { failOn = null } = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      if (failOn?.('get', key)) throw new Error('blocked');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failOn?.('set', key)) throw new Error('quota');
      values.set(key, String(value));
    },
    removeItem(key) {
      if (failOn?.('remove', key)) throw new Error('blocked');
      values.delete(key);
    },
    read(key) { return values.get(key) ?? null; },
  };
}

const historyEntry = { dieType: 'd20', value: 18, rolledAt: 100 };
const normalizedHistoryEntry = {
  ...historyEntry,
  mode: 'normal',
  rolls: [18],
  modifier: 0,
  criticalsEnabled: true,
  difficulty: 15,
  difficultyEnabled: true,
};
const presetLibrary = {
  presets: [{
    id: 'preset-1',
    name: 'Stealth',
    dieType: 'd20',
    mode: 'normal',
    modifier: 0,
    difficultyEnabled: true,
    criticalsEnabled: true,
    difficulty: 15,
  }],
  recentIds: ['preset-1'],
};

test('campaign state normalization trims values, removes invalid duplicates, and repairs selection', () => {
  assert.deepEqual(normalizeCampaignState({
    campaigns: [
      { id: ' first ', name: ' Curse of Strahd ', ignored: true },
      { id: 'first', name: 'Duplicate' },
      { id: 'second', name: '' },
      null,
    ],
    selectedCampaignId: ' first ',
  }), {
    campaigns: [{ id: 'first', name: 'Curse of Strahd' }],
    selectedCampaignId: 'first',
  });
  assert.deepEqual(normalizeCampaignState({ campaigns: [{ id: 'first', name: 'One' }], selectedCampaignId: 'missing' }), {
    campaigns: [{ id: 'first', name: 'One' }],
    selectedCampaignId: null,
  });
  assert.deepEqual(normalizeCampaignState(null), { campaigns: [], selectedCampaignId: null });
});

test('campaign names are trimmed, required, and capped at 80 characters', () => {
  assert.equal(normalizeCampaignName('  Icewind Dale  '), 'Icewind Dale');
  assert.equal(normalizeCampaignName(''), null);
  assert.equal(normalizeCampaignName(' '.repeat(5)), null);
  assert.equal(normalizeCampaignName('x'.repeat(81)), null);
});

test('campaign search is trimmed, case and diacritic insensitive, and preserves newest-first order', () => {
  const state = {
    campaigns: [
      { id: 'newest', name: 'Äventyr i Åmål' },
      { id: 'duplicate-1', name: 'Ravenloft' },
      { id: 'duplicate-2', name: 'Ravenloft' },
      { id: 'oldest', name: 'Överlevnad' },
      { id: 'invalid', name: '' },
    ],
    selectedCampaignId: 'newest',
  };

  assert.deepEqual(searchCampaigns(state).map(({ id }) => id), ['newest', 'duplicate-1', 'duplicate-2', 'oldest']);
  assert.deepEqual(searchCampaigns(state, '  aventyr ').map(({ id }) => id), ['newest']);
  assert.deepEqual(searchCampaigns(state, 'RAVEN').map(({ id }) => id), ['duplicate-1', 'duplicate-2']);
  assert.deepEqual(searchCampaigns(state, 'over').map(({ id }) => id), ['oldest']);
  assert.deepEqual(searchCampaigns({ campaigns: 'broken' }, 'anything'), []);
});

test('campaign CRUD uses immutable unique ids, newest-first order, and active deletion fallback', () => {
  const first = createCampaign(null, 'First', { idFactory: () => 'campaign-1' });
  const second = createCampaign(first.state, 'Second', { idFactory: () => 'campaign-2' });
  assert.deepEqual(second.state, {
    campaigns: [
      { id: 'campaign-2', name: 'Second' },
      { id: 'campaign-1', name: 'First' },
    ],
    selectedCampaignId: 'campaign-2',
  });

  const renamed = renameCampaign(second.state, 'campaign-1', '  Renamed  ');
  assert.deepEqual(renamed.campaign, { id: 'campaign-1', name: 'Renamed' });
  assert.equal(renamed.state.selectedCampaignId, 'campaign-2');
  assert.equal(selectCampaign(renamed.state, 'campaign-1').selectedCampaignId, 'campaign-1');
  assert.equal(selectCampaign(renamed.state, 'missing').selectedCampaignId, 'campaign-2');
  assert.equal(selectCampaign(renamed.state, null).selectedCampaignId, null);

  const removed = deleteCampaign(second.state, 'campaign-2');
  assert.equal(removed.state.selectedCampaignId, null);
  assert.deepEqual(removed.state.campaigns, [{ id: 'campaign-1', name: 'First' }]);
});

test('campaign creation retries collisions and UUID fallback is version 4 variant', () => {
  let attempts = 0;
  const state = { campaigns: [{ id: 'duplicate', name: 'Existing' }], selectedCampaignId: null };
  const created = createCampaign(state, 'New', {
    idFactory: () => (++attempts === 1 ? 'duplicate' : 'unique'),
  });
  assert.equal(created.campaign.id, 'unique');
  assert.throws(() => createCampaign(state, 'New', { idFactory: () => 'duplicate' }), /unique campaign id/);

  const cryptoApi = { getRandomValues(bytes) { bytes.fill(0xab); return bytes; } };
  assert.equal(createCampaignId(cryptoApi), 'abababab-abab-4bab-abab-abababababab');
});

test('campaign registry load and save recover from missing, corrupt, blocked, and quota-limited storage', () => {
  assert.deepEqual(loadCampaignState(null), { campaigns: [], selectedCampaignId: null });
  assert.deepEqual(loadCampaignState(createMemoryStorage({ [CAMPAIGN_STORAGE_KEY]: '{broken' })), { campaigns: [], selectedCampaignId: null });
  assert.deepEqual(loadCampaignState({ getItem() { throw new Error('blocked'); } }), { campaigns: [], selectedCampaignId: null });

  const storage = createMemoryStorage();
  const saved = saveCampaignState(storage, { campaigns: [{ id: 'one', name: 'One' }], selectedCampaignId: 'one' });
  assert.equal(saved.persisted, true);
  assert.deepEqual(JSON.parse(storage.read(CAMPAIGN_STORAGE_KEY)), saved.state);
  assert.equal(saveCampaignState({ setItem() { throw new Error('quota'); } }, saved.state).persisted, false);
});

test('scoped storage isolates campaign history and presets while null keeps campaign-less keys', () => {
  const storage = createMemoryStorage();
  const first = createCampaignStorage(storage, 'campaign-1');
  const second = createCampaignStorage(storage, 'campaign-2');
  first.setItem(HISTORY_STORAGE_KEY, 'first-history');
  second.setItem(HISTORY_STORAGE_KEY, 'second-history');
  first.setItem(PRESET_STORAGE_KEY, 'first-presets');
  storage.setItem(HISTORY_STORAGE_KEY, 'standalone-history');

  assert.equal(first.getItem(HISTORY_STORAGE_KEY), 'first-history');
  assert.equal(second.getItem(HISTORY_STORAGE_KEY), 'second-history');
  assert.equal(first.getItem(PRESET_STORAGE_KEY), 'first-presets');
  assert.equal(createCampaignStorage(storage, null).getItem(HISTORY_STORAGE_KEY), 'standalone-history');
  assert.notEqual(campaignStorageKey('campaign-1', HISTORY_STORAGE_KEY), HISTORY_STORAGE_KEY);
});

test('campaign-less transfer preserves normalized history, presets, and recent ordering', () => {
  const storage = createMemoryStorage({
    [HISTORY_STORAGE_KEY]: JSON.stringify([historyEntry]),
    [PRESET_STORAGE_KEY]: JSON.stringify(presetLibrary),
  });
  const created = createCampaign(null, 'Moved', { idFactory: () => 'campaign-1' });
  const success = commitCampaignlessTransfer(storage, created.state, created.campaign.id, {
    history: [historyEntry],
    presetLibrary,
  });
  assert.equal(success, true);
  assert.equal(storage.read(HISTORY_STORAGE_KEY), null);
  assert.equal(storage.read(PRESET_STORAGE_KEY), null);
  assert.deepEqual(loadCampaignState(storage), created.state);
  assert.deepEqual(loadHistory(createCampaignStorage(storage, 'campaign-1')), [normalizedHistoryEntry]);
  assert.deepEqual(loadPresets(createCampaignStorage(storage, 'campaign-1')), presetLibrary);
});

test('creating from an active campaign selects an empty scope without changing the source campaign', () => {
  const storage = createMemoryStorage();
  const firstState = createCampaign(null, 'First', { idFactory: () => 'campaign-1' }).state;
  const firstStorage = createCampaignStorage(storage, 'campaign-1');
  firstStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([historyEntry]));
  firstStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presetLibrary));

  const second = createCampaign(firstState, 'Second', { idFactory: () => 'campaign-2' });
  assert.equal(saveCampaignState(storage, second.state).persisted, true);
  assert.equal(second.state.selectedCampaignId, 'campaign-2');
  assert.deepEqual(loadHistory(createCampaignStorage(storage, 'campaign-2')), []);
  assert.deepEqual(loadPresets(createCampaignStorage(storage, 'campaign-2')), { presets: [], recentIds: [] });
  assert.deepEqual(loadHistory(firstStorage), [normalizedHistoryEntry]);
  assert.deepEqual(loadPresets(firstStorage), presetLibrary);
});

test('failed campaign-less transfer rolls back registry, destination, and source data', () => {
  const originalHistory = JSON.stringify([historyEntry]);
  const originalPresets = JSON.stringify(presetLibrary);
  const storage = createMemoryStorage({
    [HISTORY_STORAGE_KEY]: originalHistory,
    [PRESET_STORAGE_KEY]: originalPresets,
  }, {
    failOn: (operation, key) => operation === 'set' && key === CAMPAIGN_STORAGE_KEY,
  });
  const created = createCampaign(null, 'Failed', { idFactory: () => 'campaign-1' });
  assert.equal(commitCampaignlessTransfer(storage, created.state, created.campaign.id, {
    history: [historyEntry],
    presetLibrary,
  }), false);
  assert.equal(storage.read(HISTORY_STORAGE_KEY), originalHistory);
  assert.equal(storage.read(PRESET_STORAGE_KEY), originalPresets);
  assert.equal(storage.read(campaignStorageKey('campaign-1', HISTORY_STORAGE_KEY)), null);
  assert.equal(storage.read(campaignStorageKey('campaign-1', PRESET_STORAGE_KEY)), null);
  assert.equal(storage.read(CAMPAIGN_STORAGE_KEY), null);
});

test('a partially failed source cleanup restores campaign-less data and removes the staged campaign', () => {
  const originalHistory = JSON.stringify([historyEntry]);
  const originalPresets = JSON.stringify(presetLibrary);
  let removalFailed = false;
  const storage = createMemoryStorage({
    [HISTORY_STORAGE_KEY]: originalHistory,
    [PRESET_STORAGE_KEY]: originalPresets,
  }, {
    failOn: (operation, key) => {
      if (operation === 'remove' && key === PRESET_STORAGE_KEY && !removalFailed) {
        removalFailed = true;
        return true;
      }
      return false;
    },
  });
  const created = createCampaign(null, 'Failed cleanup', { idFactory: () => 'campaign-1' });
  assert.equal(commitCampaignlessTransfer(storage, created.state, created.campaign.id, {
    history: [historyEntry],
    presetLibrary,
  }), false);
  assert.equal(storage.read(HISTORY_STORAGE_KEY), originalHistory);
  assert.equal(storage.read(PRESET_STORAGE_KEY), originalPresets);
  assert.equal(storage.read(CAMPAIGN_STORAGE_KEY), null);
  assert.equal(storage.read(campaignStorageKey('campaign-1', HISTORY_STORAGE_KEY)), null);
  assert.equal(storage.read(campaignStorageKey('campaign-1', PRESET_STORAGE_KEY)), null);
});

test('campaign data removal clears both namespaced stores and remains safe without storage', () => {
  const historyKey = campaignStorageKey('campaign-1', HISTORY_STORAGE_KEY);
  const presetKey = campaignStorageKey('campaign-1', PRESET_STORAGE_KEY);
  const storage = createMemoryStorage({ [historyKey]: 'history', [presetKey]: 'presets' });
  assert.equal(removeCampaignData(storage, 'campaign-1'), true);
  assert.equal(storage.read(historyKey), null);
  assert.equal(storage.read(presetKey), null);
  assert.equal(removeCampaignData(null, 'campaign-1'), true);
});
