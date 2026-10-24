import { HISTORY_STORAGE_KEY, normalizeHistory } from './history.js';
import { PRESET_STORAGE_KEY, normalizePresetLibrary } from './presets.js';

export const CAMPAIGN_STORAGE_KEY = 'odets-kast.campaigns.v1';
export const CAMPAIGN_STORAGE_PREFIX = 'odets-kast.campaign-data.v1';
export const MAX_CAMPAIGN_NAME_LENGTH = 80;

const MAX_CAMPAIGN_ID_LENGTH = 200;

export function createEmptyCampaignState() {
  return { campaigns: [], selectedCampaignId: null };
}

function normalizeIdentifier(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_CAMPAIGN_ID_LENGTH) return null;
  return normalized;
}

export function normalizeCampaignName(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_CAMPAIGN_NAME_LENGTH) return null;
  return normalized;
}

export function normalizeCampaign(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const id = normalizeIdentifier(candidate.id);
  const name = normalizeCampaignName(candidate.name);
  return id && name ? { id, name } : null;
}

export function normalizeCampaignState(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return createEmptyCampaignState();
  }

  const seenIds = new Set();
  const campaigns = Array.isArray(candidate.campaigns)
    ? candidate.campaigns.reduce((normalized, item) => {
      const campaign = normalizeCampaign(item);
      if (!campaign || seenIds.has(campaign.id)) return normalized;
      seenIds.add(campaign.id);
      normalized.push(campaign);
      return normalized;
    }, [])
    : [];
  const selectedCampaignId = normalizeIdentifier(candidate.selectedCampaignId);

  return {
    campaigns,
    selectedCampaignId: selectedCampaignId && seenIds.has(selectedCampaignId)
      ? selectedCampaignId
      : null,
  };
}

function searchableCampaignName(name) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

export function searchCampaigns(state, query = '') {
  const campaigns = normalizeCampaignState(state).campaigns;
  const needle = searchableCampaignName(String(query).trim());
  return campaigns.filter((campaign) => searchableCampaignName(campaign.name).includes(needle));
}

export function loadCampaignState(storage) {
  if (!storage) return createEmptyCampaignState();
  try {
    const stored = storage.getItem(CAMPAIGN_STORAGE_KEY);
    return stored === null
      ? createEmptyCampaignState()
      : normalizeCampaignState(JSON.parse(stored));
  } catch {
    return createEmptyCampaignState();
  }
}

export function saveCampaignState(storage, state) {
  const normalized = normalizeCampaignState(state);
  if (!storage) return { state: normalized, persisted: false };
  try {
    storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(normalized));
    return { state: normalized, persisted: true };
  } catch {
    return { state: normalized, persisted: false };
  }
}

export function createCampaignId(cryptoApi = globalThis.crypto) {
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues !== 'function') {
    throw new TypeError('Web Crypto is required to create a campaign');
  }

  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

export function createCampaign(state, name, { idFactory = createCampaignId } = {}) {
  const normalized = normalizeCampaignState(state);
  const normalizedName = normalizeCampaignName(name);
  if (!normalizedName) throw new TypeError('Invalid campaign name');

  const existingIds = new Set(normalized.campaigns.map(({ id }) => id));
  let id = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = normalizeIdentifier(idFactory());
    if (candidate && !existingIds.has(candidate)) {
      id = candidate;
      break;
    }
  }
  if (!id) throw new Error('Unable to create a unique campaign id');

  const campaign = { id, name: normalizedName };
  return {
    campaign,
    state: {
      campaigns: [campaign, ...normalized.campaigns],
      selectedCampaignId: campaign.id,
    },
  };
}

export function renameCampaign(state, id, name) {
  const normalized = normalizeCampaignState(state);
  const normalizedName = normalizeCampaignName(name);
  if (!normalizedName) throw new TypeError('Invalid campaign name');
  const index = normalized.campaigns.findIndex((campaign) => campaign.id === id);
  if (index < 0) return { state: normalized, campaign: null };

  const campaigns = [...normalized.campaigns];
  campaigns[index] = { ...campaigns[index], name: normalizedName };
  return { state: { ...normalized, campaigns }, campaign: campaigns[index] };
}

export function selectCampaign(state, id) {
  const normalized = normalizeCampaignState(state);
  if (id === null) return { ...normalized, selectedCampaignId: null };
  return normalized.campaigns.some((campaign) => campaign.id === id)
    ? { ...normalized, selectedCampaignId: id }
    : normalized;
}

export function deleteCampaign(state, id) {
  const normalized = normalizeCampaignState(state);
  const campaign = normalized.campaigns.find((item) => item.id === id) ?? null;
  if (!campaign) return { state: normalized, campaign: null };
  return {
    campaign,
    state: {
      campaigns: normalized.campaigns.filter((item) => item.id !== id),
      selectedCampaignId: normalized.selectedCampaignId === id
        ? null
        : normalized.selectedCampaignId,
    },
  };
}

export function campaignStorageKey(campaignId, baseKey) {
  const normalizedId = normalizeIdentifier(campaignId);
  if (!normalizedId) throw new TypeError('Invalid campaign id');
  return `${CAMPAIGN_STORAGE_PREFIX}.${encodeURIComponent(normalizedId)}.${baseKey}`;
}

export function createCampaignStorage(storage, campaignId) {
  if (!storage || campaignId === null) return storage;
  return {
    getItem(key) {
      return storage.getItem(campaignStorageKey(campaignId, key));
    },
    setItem(key, value) {
      storage.setItem(campaignStorageKey(campaignId, key), value);
    },
    removeItem(key) {
      storage.removeItem(campaignStorageKey(campaignId, key));
    },
  };
}

function restoreSnapshot(storage, snapshot) {
  snapshot.forEach((value, key) => {
    try {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    } catch {
      // Best-effort rollback; the original in-memory data remains intact.
    }
  });
}

export function commitCampaignlessTransfer(storage, state, campaignId, data) {
  const normalizedState = normalizeCampaignState(state);
  if (!normalizedState.campaigns.some((campaign) => campaign.id === campaignId)) return false;
  if (!storage) return true;

  const destinationHistoryKey = campaignStorageKey(campaignId, HISTORY_STORAGE_KEY);
  const destinationPresetKey = campaignStorageKey(campaignId, PRESET_STORAGE_KEY);
  const keys = [
    CAMPAIGN_STORAGE_KEY,
    HISTORY_STORAGE_KEY,
    PRESET_STORAGE_KEY,
    destinationHistoryKey,
    destinationPresetKey,
  ];
  const snapshot = new Map();
  try {
    keys.forEach((key) => snapshot.set(key, storage.getItem(key)));
    storage.setItem(destinationHistoryKey, JSON.stringify(normalizeHistory(data?.history)));
    storage.setItem(destinationPresetKey, JSON.stringify(normalizePresetLibrary(data?.presetLibrary)));
    storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(normalizedState));
    storage.removeItem(HISTORY_STORAGE_KEY);
    storage.removeItem(PRESET_STORAGE_KEY);
    return true;
  } catch {
    restoreSnapshot(storage, snapshot);
    return false;
  }
}

export function removeCampaignData(storage, campaignId) {
  if (!storage) return true;
  try {
    storage.removeItem(campaignStorageKey(campaignId, HISTORY_STORAGE_KEY));
    storage.removeItem(campaignStorageKey(campaignId, PRESET_STORAGE_KEY));
    return true;
  } catch {
    return false;
  }
}
