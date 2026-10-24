import { DiceScene } from './dice-scene.js';
import {
  commitCampaignlessTransfer,
  createCampaign,
  createCampaignStorage,
  deleteCampaign,
  loadCampaignState,
  normalizeCampaignName,
  removeCampaignData,
  renameCampaign,
  saveCampaignState,
  searchCampaigns,
  selectCampaign,
} from './campaigns.js';
import {
  DEFAULT_DIFFICULTY,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  parseDifficulty,
} from './difficulty.js';
import { evaluateArithmeticExpression, normalizeArithmeticInput } from './arithmetic-expression.js';
import { DICE_TYPES, getDiceDefinition, getSecureRoll } from './dice-geometry.js';
import { createDiceTheme, getDiceThemeStyles } from './dice-theme.js';
import { addHistoryEntry, clearHistory, loadHistory } from './history.js';
import { localeForLanguage, translate } from './i18n.js';
import {
  MAX_MODIFIER,
  MIN_MODIFIER,
  applyModifier,
  formatModifiedTotal,
  formatModifier,
  formatModifierInput,
  parseModifier,
} from './modifier.js';
import { getOutcome } from './outcomes.js';
import {
  createEmptyPresetLibrary,
  createDefaultPresetDraft,
  createPreset,
  deletePreset,
  getPreset,
  loadPresets,
  markPresetUsed,
  mergePresetConfiguration,
  normalizePresetName,
  presetConfigurationsEqual,
  savePresets,
  searchPresets,
  updatePreset,
} from './presets.js';
import { getRollModeDetails, nextRollMode, resolveRoll } from './roll-mode.js';
import {
  SUPPORTED_FPS,
  loadSettings,
  resetSettings,
  saveSettings,
} from './settings.js';
import { StaticDiceFallback } from './static-dice-fallback.js';
import { TOOLTIP_DELAY_MS, calculateTooltipPosition } from './tooltip.js';

const appScene = document.querySelector('#app-scene');
const canvas = document.querySelector('#dice-canvas');
const diceViewport = document.querySelector('#dice-viewport');
const dieButton = document.querySelector('#die');
const rollAgain = document.querySelector('#roll-again');
const rollActions = document.querySelector('#roll-actions');
const rollReset = document.querySelector('#roll-reset');
const rollValue = document.querySelector('#roll-value');
const outcomePanel = document.querySelector('.outcome-panel');
const outcomeLabel = document.querySelector('#outcome-label');
const outcomeText = document.querySelector('#outcome-text');
const arenaStatus = document.querySelector('#arena-status');
const arenaEyebrow = document.querySelector('#arena-eyebrow');
const sceneLoading = document.querySelector('#scene-loading');
const fallbackDice = [...document.querySelectorAll('.fallback-die')];
const dieOptions = [...document.querySelectorAll('.die-option')];
const rollModeButton = document.querySelector('#roll-mode');
const rollModeValue = document.querySelector('#roll-mode-value');
const difficultyControl = document.querySelector('#difficulty-control');
const difficultyToggleRow = document.querySelector('#difficulty-toggle-row');
const difficultyToggle = document.querySelector('#difficulty-toggle');
const difficultyToggleState = document.querySelector('#difficulty-toggle-state');
const difficultyDecrease = document.querySelector('#difficulty-decrease');
const difficultyInput = document.querySelector('#difficulty-value');
const difficultyIncrease = document.querySelector('#difficulty-increase');
const criticalToggleRow = document.querySelector('#critical-toggle-row');
const criticalToggle = document.querySelector('#critical-toggle');
const criticalToggleState = document.querySelector('#critical-toggle-state');
const rollMeta = document.querySelector('#roll-meta');
const criticalMetaEnabled = document.querySelector('#critical-meta-enabled');
const criticalMetaDisabled = document.querySelector('#critical-meta-disabled');
const rollBreakdown = document.querySelector('#roll-breakdown');
const modifierDecrease = document.querySelector('#modifier-decrease');
const modifierInput = document.querySelector('#modifier-value');
const modifierIncrease = document.querySelector('#modifier-increase');
const campaignContext = document.querySelector('#campaign-context');
const campaignsOpen = document.querySelector('#campaigns-open');
const campaignsDialog = document.querySelector('#campaigns-dialog');
const campaignsPopover = document.querySelector('#campaigns-popover');
const campaignsBack = document.querySelector('#campaigns-back');
const campaignsSummary = document.querySelector('#campaigns-summary');
const campaignsNew = document.querySelector('#campaigns-new');
const campaignsClose = document.querySelector('#campaigns-close');
const campaignsListView = document.querySelector('#campaigns-list-view');
const campaignsSearchShell = document.querySelector('#campaigns-search-shell');
const campaignsSearch = document.querySelector('#campaigns-search');
const campaignsSearchSummary = document.querySelector('#campaigns-search-summary');
const campaignsList = document.querySelector('#campaigns-list');
const campaignsNoResults = document.querySelector('#campaigns-no-results');
const campaignCreate = document.querySelector('#campaign-create');
const campaignCreateName = document.querySelector('#campaign-create-name');
const campaignCreateDescription = document.querySelector('#campaign-create-description');
const campaignCreateError = document.querySelector('#campaign-create-error');
const campaignCreateStorageError = document.querySelector('#campaign-create-storage-error');
const campaignCreateCancel = document.querySelector('#campaign-create-cancel');
const campaignManage = document.querySelector('#campaign-manage');
const campaignManageTitle = document.querySelector('#campaign-manage-title');
const campaignManageCounts = document.querySelector('#campaign-manage-counts');
const campaignManageName = document.querySelector('#campaign-manage-name');
const campaignManageError = document.querySelector('#campaign-manage-error');
const campaignManageStorageError = document.querySelector('#campaign-manage-storage-error');
const campaignDelete = document.querySelector('#campaign-delete');
const campaignDeleteConfirmation = document.querySelector('#campaign-delete-confirmation');
const campaignDeleteDescription = document.querySelector('#campaign-delete-description');
const campaignConfirmDelete = document.querySelector('#campaign-confirm-delete');
const campaignCancelDelete = document.querySelector('#campaign-cancel-delete');
const campaignStatus = document.querySelector('#campaign-status');
const historyOpen = document.querySelector('#history-open');
const historyDialog = document.querySelector('#history-dialog');
const historyClose = document.querySelector('#history-close');
const historySummary = document.querySelector('#history-summary');
const historyList = document.querySelector('#history-list');
const historyEmpty = document.querySelector('#history-empty');
const historyFooter = document.querySelector('#history-footer');
const historyClear = document.querySelector('#history-clear');
const historyClearConfirmation = document.querySelector('#history-clear-confirmation');
const historyConfirmClear = document.querySelector('#history-confirm-clear');
const historyCancelClear = document.querySelector('#history-cancel-clear');
const presetsOpen = document.querySelector('#presets-open');
const presetsCountBadge = document.querySelector('#presets-count-badge');
const recentPresetsSummary = document.querySelector('#recent-presets-summary');
const recentPresetsList = document.querySelector('#recent-presets-list');
const recentPresetsEmpty = document.querySelector('#recent-presets-empty');
const presetApplicationStatus = document.querySelector('#preset-application-status');
const presetsDialog = document.querySelector('#presets-dialog');
const presetsModal = document.querySelector('#presets-modal');
const presetsDialogSummary = document.querySelector('#presets-dialog-summary');
const presetsBack = document.querySelector('#presets-back');
const presetsNew = document.querySelector('#presets-new');
const presetsClose = document.querySelector('#presets-close');
const presetsSearch = document.querySelector('#presets-search');
const presetsSearchSummary = document.querySelector('#presets-search-summary');
const presetsList = document.querySelector('#presets-list');
const presetsLibraryEmpty = document.querySelector('#presets-library-empty');
const presetsNoResults = document.querySelector('#presets-no-results');
const presetsEmptyNew = document.querySelector('#presets-empty-new');
const presetDetailEmpty = document.querySelector('#preset-detail-empty');
const presetPreview = document.querySelector('#preset-preview');
const presetPreviewDie = document.querySelector('#preset-preview-die');
const presetPreviewName = document.querySelector('#preset-preview-name');
const presetPreviewSummary = document.querySelector('#preset-preview-summary');
const presetPreviewMode = document.querySelector('#preset-preview-mode');
const presetPreviewModifier = document.querySelector('#preset-preview-modifier');
const presetPreviewD20Section = document.querySelector('#preset-preview-d20-section');
const presetPreviewDifficulty = document.querySelector('#preset-preview-difficulty');
const presetPreviewCriticals = document.querySelector('#preset-preview-criticals');
const presetUse = document.querySelector('#preset-use');
const presetEdit = document.querySelector('#preset-edit');
const presetDelete = document.querySelector('#preset-delete');
const presetDeleteConfirmation = document.querySelector('#preset-delete-confirmation');
const presetConfirmDelete = document.querySelector('#preset-confirm-delete');
const presetCancelDelete = document.querySelector('#preset-cancel-delete');
const presetEditor = document.querySelector('#preset-editor');
const presetEditorEyebrow = document.querySelector('#preset-editor-eyebrow');
const presetEditorTitle = document.querySelector('#preset-editor-title');
const presetName = document.querySelector('#preset-name');
const presetNameError = document.querySelector('#preset-name-error');
const presetDieOptions = [...document.querySelectorAll('[data-preset-die]')];
const presetModeOptions = [...document.querySelectorAll('[data-preset-mode]')];
const presetModifierDecrease = document.querySelector('#preset-modifier-decrease');
const presetModifierInput = document.querySelector('#preset-modifier');
const presetModifierIncrease = document.querySelector('#preset-modifier-increase');
const presetDifficultyRow = document.querySelector('#preset-difficulty-row');
const presetDifficultyEnabled = document.querySelector('#preset-difficulty-enabled');
const presetDifficultyState = document.querySelector('#preset-difficulty-state');
const presetDifficultyValueRow = document.querySelector('#preset-difficulty-value-row');
const presetDifficultyDecrease = document.querySelector('#preset-difficulty-decrease');
const presetDifficultyInput = document.querySelector('#preset-difficulty');
const presetDifficultyIncrease = document.querySelector('#preset-difficulty-increase');
const presetCriticalsRow = document.querySelector('#preset-criticals-row');
const presetCriticalsEnabled = document.querySelector('#preset-criticals-enabled');
const presetCriticalsState = document.querySelector('#preset-criticals-state');
const presetEditorCancel = document.querySelector('#preset-editor-cancel');
const presetUnsavedConfirmation = document.querySelector('#preset-unsaved-confirmation');
const presetUnsavedSave = document.querySelector('#preset-unsaved-save');
const presetUnsavedDiscard = document.querySelector('#preset-unsaved-discard');
const presetUnsavedCancel = document.querySelector('#preset-unsaved-cancel');
const settingsOpen = document.querySelector('#settings-open');
const settingsDialog = document.querySelector('#settings-dialog');
const settingsClose = document.querySelector('#settings-close');
const languageOptions = [...document.querySelectorAll('[data-language]')];
const fpsOptions = [...document.querySelectorAll('[data-fps]')];
const settingsSoundRow = document.querySelector('#settings-sound-row');
const settingsSound = document.querySelector('#settings-sound');
const settingsSoundState = document.querySelector('#settings-sound-state');
const settingsDieOptions = [...document.querySelectorAll('[data-settings-die]')];
const settingsDiePreview = document.querySelector('#settings-die-preview');
const settingsColorInputs = {
  face: document.querySelector('#settings-color-face'),
  edge: document.querySelector('#settings-color-edge'),
  number: document.querySelector('#settings-color-number'),
};
const settingsReset = document.querySelector('#settings-reset');
const settingsResetConfirmation = document.querySelector('#settings-reset-confirmation');
const settingsConfirmReset = document.querySelector('#settings-confirm-reset');
const settingsCancelReset = document.querySelector('#settings-cancel-reset');
const hoverTooltip = document.querySelector('#hover-tooltip');
const metaDescription = document.querySelector('meta[name="description"]');
const randomBuffer = new Uint32Array(1);
let tooltipShowTimeout = null;
let tooltipTarget = null;
let expressionTooltipTarget = null;
let keyboardTooltipFocus = false;

let rolling = false;
let diceScene;
let activeDieType = 'd20';
let activeRollMode = 'normal';
let activeModifier = 0;
let activeDifficulty = DEFAULT_DIFFICULTY;
let difficultyEnabled = true;
let criticalsEnabled = true;
let hasCompletedRoll = false;
let historyStorage;
let campaignDataStorage;
let campaignState;
let appSettings;
let settingsDieType = 'd20';
let presetLibrary;
let selectedPresetId = null;
let lastAppliedPresetId = null;
let presetEditorMode = null;
let presetEditorId = null;
let presetEditorInitialSnapshot = null;
let presetEditorDieType = 'd20';
let presetEditorRollMode = 'normal';
let presetEditorModifier = 0;
let presetEditorDifficulty = DEFAULT_DIFFICULTY;
let presetEditorHasD20Rules = true;
let pendingPresetAction = null;
let managedCampaignId = null;
let currentArenaStatus = { key: 'arena.waiting', parameters: { die: 'D20' } };
let outcomePresentation = { kind: 'result', arguments: { value: 12 } };
const paletteUpdateTimeouts = new Map();
const campaignScopeCache = new Map();
const DIE_GLYPH_CLASSES = DICE_TYPES.map((type) => `glyph-${type}`);

try {
  historyStorage = window.localStorage;
  historyStorage.getItem('odets-kast.storage-availability-check');
} catch {
  historyStorage = null;
}

campaignState = loadCampaignState(historyStorage);
campaignDataStorage = createCampaignStorage(historyStorage, campaignState.selectedCampaignId);
let rollHistory = loadHistory(campaignDataStorage);
presetLibrary = loadPresets(campaignDataStorage);
appSettings = loadSettings(historyStorage);
let historyDateFormatter = new Intl.DateTimeFormat(localeForLanguage(appSettings.language), {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function t(key, parameters) {
  return translate(appSettings.language, key, parameters);
}

const arithmeticInputConfigurations = new Map([
  [modifierInput, { parse: parseModifier, format: formatModifierInput }],
  [difficultyInput, { parse: parseDifficulty, format: String }],
  [presetModifierInput, { parse: parseModifier, format: formatModifierInput }],
  [presetDifficultyInput, { parse: parseDifficulty, format: String }],
]);

function updateExpressionPreview(input) {
  const configuration = arithmeticInputConfigurations.get(input);
  if (!configuration) return;

  const evaluation = evaluateArithmeticExpression(input.value);
  let resultCopy;
  if (evaluation.status === 'valid') {
    const parsed = configuration.parse(input.value);
    resultCopy = parsed === null
      ? t('expression.invalid')
      : `= ${configuration.format(parsed)}`;
  } else {
    resultCopy = t(`expression.${evaluation.status}`);
  }
  showExpressionTooltip(input, input.value, resultCopy);
}

function handleArithmeticInput(event) {
  const input = event.currentTarget;
  const normalized = normalizeArithmeticInput(input.value, input.selectionStart, input.selectionEnd);
  input.value = normalized.value;
  input.setSelectionRange(normalized.selectionStart, normalized.selectionEnd);
  updateExpressionPreview(input);
}

function campaignCacheKey(campaignId) {
  return campaignId ?? '__standalone__';
}

function activeCampaign() {
  return campaignState.campaigns.find(({ id }) => id === campaignState.selectedCampaignId) ?? null;
}

function campaignScopeLabel(campaignId = campaignState.selectedCampaignId) {
  if (campaignId === null) return t('campaigns.standalone');
  return campaignState.campaigns.find(({ id }) => id === campaignId)?.name ?? t('campaigns.standalone');
}

function cacheCurrentCampaignData() {
  campaignScopeCache.set(campaignCacheKey(campaignState.selectedCampaignId), {
    history: rollHistory,
    presetLibrary,
  });
}

function loadCampaignData(campaignId) {
  const key = campaignCacheKey(campaignId);
  const cached = campaignScopeCache.get(key);
  if (cached) return cached;
  const storage = createCampaignStorage(historyStorage, campaignId);
  const data = {
    history: loadHistory(storage),
    presetLibrary: loadPresets(storage),
  };
  campaignScopeCache.set(key, data);
  return data;
}

function campaignData(campaignId) {
  if (campaignId === campaignState.selectedCampaignId) {
    return { history: rollHistory, presetLibrary };
  }
  return loadCampaignData(campaignId);
}

function campaignCounts(campaignId) {
  const data = campaignData(campaignId);
  return {
    presets: data.presetLibrary.presets.length,
    rolls: data.history.length,
  };
}

function campaignCountsLabel(campaignId) {
  return t('campaigns.counts', campaignCounts(campaignId));
}

function renderCampaignContext() {
  const campaign = activeCampaign();
  const context = campaign
    ? t('campaigns.contextActive', { name: campaign.name })
    : t('campaigns.contextStandalone');
  const openLabel = campaign
    ? t('campaigns.openActive', { name: campaign.name })
    : t('campaigns.openStandalone');
  campaignContext.textContent = context;
  campaignContext.dataset.tooltip = context;
  campaignsOpen.setAttribute('aria-label', openLabel);
  campaignsOpen.dataset.tooltip = openLabel;
}

function setCampaignView(view) {
  campaignsPopover.dataset.view = view;
  campaignsListView.hidden = view !== 'list';
  campaignCreate.hidden = view !== 'create';
  campaignManage.hidden = view !== 'manage';
  campaignsBack.hidden = view === 'list';
  campaignsNew.hidden = view !== 'list';
}

const CAMPAIGN_ICON_PATHS = {
  campaign: ['M5 21V4', 'M5 5h11l-2 4 2 4H5'],
  standalone: ['M12 3.5 13.7 8.3 18.5 10l-4.8 1.7-1.7 4.8-1.7-4.8L5.5 10l4.8-1.7L12 3.5Z'],
  selected: ['m5 12 4 4 10-10'],
};

function createCampaignIcon(name, className = 'campaign-icon') {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.classList.add(className);
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');

  if (name === 'manage') {
    [6, 12, 18].forEach((cx) => {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(cx));
      dot.setAttribute('cy', '12');
      dot.setAttribute('r', '1.25');
      icon.append(dot);
    });
    return icon;
  }

  CAMPAIGN_ICON_PATHS[name].forEach((pathData) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    icon.append(path);
  });
  return icon;
}

function createCampaignListItem(campaign) {
  const campaignId = campaign?.id ?? null;
  const name = campaign?.name ?? t('campaigns.standalone');
  const counts = campaignCountsLabel(campaignId);
  const selected = campaignState.selectedCampaignId === campaignId;
  const item = document.createElement('li');
  item.className = `campaign-list-item${campaign ? '' : ' is-standalone'}`;

  const selectButton = document.createElement('button');
  selectButton.className = 'campaign-select';
  selectButton.type = 'button';
  selectButton.setAttribute('aria-current', String(selected));
  selectButton.setAttribute('aria-label', t('campaigns.selectAria', { name, counts }));

  const mark = document.createElement('span');
  mark.className = 'campaign-list-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.append(createCampaignIcon(campaign ? 'campaign' : 'standalone'));

  const copy = document.createElement('span');
  copy.className = 'campaign-list-copy';
  const title = document.createElement('strong');
  title.textContent = name;
  const detail = document.createElement('small');
  detail.textContent = campaign ? counts : `${t('campaigns.standaloneDescription')} · ${counts}`;
  copy.append(title, detail);

  const check = document.createElement('span');
  check.className = 'campaign-selected-check';
  check.setAttribute('aria-hidden', 'true');
  if (selected) check.append(createCampaignIcon('selected'));
  selectButton.append(mark, copy, check);
  selectButton.addEventListener('click', () => {
    if (campaignState.selectedCampaignId === campaignId) {
      closeCampaigns();
      return;
    }
    if (activateCampaign(campaignId)) closeCampaigns();
  });
  item.append(selectButton);

  if (campaign) {
    const manageButton = document.createElement('button');
    manageButton.className = 'campaign-manage-button';
    manageButton.type = 'button';
    const manageLabel = t('campaigns.manageAria', { name });
    manageButton.setAttribute('aria-label', manageLabel);
    manageButton.dataset.tooltip = manageLabel;
    manageButton.append(createCampaignIcon('manage'));
    manageButton.addEventListener('click', () => showCampaignManager(campaign.id));
    item.append(manageButton);
  } else {
    const manageSpacer = document.createElement('span');
    manageSpacer.className = 'campaign-manage-spacer';
    manageSpacer.setAttribute('aria-hidden', 'true');
    item.append(manageSpacer);
  }
  return item;
}

function renderCampaignList() {
  const campaigns = searchCampaigns(campaignState, campaignsSearch.value);
  const hasCampaigns = campaignState.campaigns.length > 0;
  const hasQuery = campaignsSearch.value.trim().length > 0;
  campaignsSearchShell.hidden = !hasCampaigns;
  campaignsSearch.disabled = !hasCampaigns;
  campaignsSearchSummary.textContent = hasCampaigns
    ? t('campaigns.searchResults', { count: campaigns.length })
    : '';
  campaignsNoResults.hidden = !hasCampaigns || !hasQuery || campaigns.length > 0;
  campaignsList.replaceChildren(
    createCampaignListItem(null),
    ...campaigns.map(createCampaignListItem),
  );
}

function renderCampaignSummary() {
  const campaign = activeCampaign();
  campaignsSummary.textContent = campaign
    ? t('campaigns.summaryActive', { name: campaign.name })
    : t('campaigns.summaryStandalone');
}

function renderCampaignManager() {
  const campaign = campaignState.campaigns.find(({ id }) => id === managedCampaignId);
  if (!campaign) {
    managedCampaignId = null;
    setCampaignView('list');
    return;
  }
  const counts = campaignCountsLabel(campaign.id);
  campaignManageTitle.textContent = campaign.name;
  campaignManageCounts.textContent = counts;
  campaignDeleteDescription.textContent = t('campaigns.deleteDescription', {
    name: campaign.name,
    counts,
  });
}

function renderCampaignDialog() {
  renderCampaignSummary();
  renderCampaignList();
  if (campaignsPopover.dataset.view === 'manage') renderCampaignManager();
}

function resetCampaignField(field, error, storageError) {
  field.removeAttribute('aria-invalid');
  error.hidden = true;
  storageError.hidden = true;
}

function showCampaignCreate() {
  managedCampaignId = null;
  campaignCreateName.value = '';
  resetCampaignField(campaignCreateName, campaignCreateError, campaignCreateStorageError);
  if (campaignState.selectedCampaignId === null) {
    const counts = campaignCounts(null);
    campaignCreateDescription.textContent = counts.presets > 0 || counts.rolls > 0
      ? t('campaigns.transferExisting', counts)
      : t('campaigns.startsStandaloneEmpty');
  } else {
    campaignCreateDescription.textContent = t('campaigns.startsEmpty');
  }
  setCampaignView('create');
  requestAnimationFrame(() => campaignCreateName.focus());
}

function showCampaignManager(id) {
  const campaign = campaignState.campaigns.find((item) => item.id === id);
  if (!campaign) return;
  managedCampaignId = campaign.id;
  campaignManageName.value = campaign.name;
  resetCampaignField(campaignManageName, campaignManageError, campaignManageStorageError);
  campaignDeleteConfirmation.hidden = true;
  renderCampaignManager();
  setCampaignView('manage');
  requestAnimationFrame(() => campaignManageName.focus());
}

function returnToCampaignList() {
  managedCampaignId = null;
  campaignDeleteConfirmation.hidden = true;
  setCampaignView('list');
  renderCampaignDialog();
  const selected = campaignsList.querySelector('[aria-current="true"]');
  (selected ?? campaignsSearch).focus();
}

function openCampaigns() {
  if (
    rolling
    || campaignsDialog.open
    || presetsDialog.open
    || settingsDialog.open
    || historyDialog.open
  ) return;
  managedCampaignId = null;
  campaignsSearch.value = '';
  setCampaignView('list');
  renderCampaignDialog();
  campaignsDialog.showModal();
  appScene.inert = true;
  document.body.classList.add('campaigns-is-open');
  campaignsOpen.setAttribute('aria-expanded', 'true');
  if (campaignState.campaigns.length > 0) campaignsSearch.focus();
  else campaignsList.querySelector('[aria-current="true"]')?.focus();
}

function closeCampaigns() {
  if (campaignsDialog.open) campaignsDialog.close();
}

function handleCampaignsClosed() {
  appScene.inert = false;
  document.body.classList.remove('campaigns-is-open');
  campaignsOpen.setAttribute('aria-expanded', 'false');
  managedCampaignId = null;
  campaignDeleteConfirmation.hidden = true;
  setCampaignView('list');
  campaignsOpen.focus();
}

function bindCampaignData(campaignId, data, statusText) {
  campaignDataStorage = createCampaignStorage(historyStorage, campaignId);
  rollHistory = data.history;
  presetLibrary = data.presetLibrary;
  campaignScopeCache.set(campaignCacheKey(campaignId), data);
  selectedPresetId = null;
  lastAppliedPresetId = null;
  resetRollForPresetSelection();
  diceScene?.highlightDice([]);
  renderCampaignContext();
  updateSelectedDieUi();
  renderHistory();
  setArenaStatus('arena.waiting', { die: activeDefinition().label });
  renderCampaignDialog();
  campaignStatus.textContent = statusText;
}

function activateCampaign(campaignId) {
  if (rolling) return false;
  const nextState = selectCampaign(campaignState, campaignId);
  if (nextState.selectedCampaignId !== campaignId) return false;
  cacheCurrentCampaignData();
  const data = loadCampaignData(campaignId);
  const saved = saveCampaignState(historyStorage, nextState);
  if (historyStorage && !saved.persisted) {
    campaignsSummary.textContent = t('campaigns.storageErrorShort');
    return false;
  }
  campaignState = saved.state;
  const campaign = activeCampaign();
  bindCampaignData(campaignId, data, campaign
    ? t('campaigns.switchedActive', { name: campaign.name })
    : t('campaigns.switchedStandalone'));
  return true;
}

function createCampaignFromEditor() {
  const name = normalizeCampaignName(campaignCreateName.value);
  if (!name) {
    campaignCreateName.setAttribute('aria-invalid', 'true');
    campaignCreateError.hidden = false;
    campaignCreateName.focus();
    return false;
  }

  const sourceWasStandalone = campaignState.selectedCampaignId === null;
  const sourceData = { history: rollHistory, presetLibrary };
  let created;
  try {
    created = createCampaign(campaignState, name);
  } catch {
    campaignCreateStorageError.hidden = false;
    return false;
  }

  cacheCurrentCampaignData();
  if (sourceWasStandalone) {
    const transferred = commitCampaignlessTransfer(
      historyStorage,
      created.state,
      created.campaign.id,
      sourceData,
    );
    if (!transferred) {
      campaignCreateStorageError.hidden = false;
      return false;
    }
    campaignScopeCache.set(campaignCacheKey(null), {
      history: [],
      presetLibrary: createEmptyPresetLibrary(),
    });
    campaignScopeCache.set(campaignCacheKey(created.campaign.id), sourceData);
  } else {
    const saved = saveCampaignState(historyStorage, created.state);
    if (historyStorage && !saved.persisted) {
      campaignCreateStorageError.hidden = false;
      return false;
    }
    created.state = saved.state;
    campaignScopeCache.set(campaignCacheKey(created.campaign.id), {
      history: [],
      presetLibrary: createEmptyPresetLibrary(),
    });
  }

  campaignState = created.state;
  const targetData = campaignScopeCache.get(campaignCacheKey(created.campaign.id));
  bindCampaignData(
    created.campaign.id,
    targetData,
    t('campaigns.created', { name: created.campaign.name }),
  );
  closeCampaigns();
  return true;
}

function renameManagedCampaign() {
  const name = normalizeCampaignName(campaignManageName.value);
  if (!name) {
    campaignManageName.setAttribute('aria-invalid', 'true');
    campaignManageError.hidden = false;
    campaignManageName.focus();
    return false;
  }
  const renamed = renameCampaign(campaignState, managedCampaignId, name);
  if (!renamed.campaign) return false;
  const saved = saveCampaignState(historyStorage, renamed.state);
  if (historyStorage && !saved.persisted) {
    campaignManageStorageError.hidden = false;
    return false;
  }
  campaignState = saved.state;
  renderCampaignContext();
  renderHistory();
  campaignStatus.textContent = t('campaigns.renamed', { name: renamed.campaign.name });
  returnToCampaignList();
  return true;
}

function deleteManagedCampaign() {
  const removed = deleteCampaign(campaignState, managedCampaignId);
  if (!removed.campaign) return false;
  const wasActive = campaignState.selectedCampaignId === removed.campaign.id;
  const standaloneData = wasActive ? loadCampaignData(null) : null;
  const saved = saveCampaignState(historyStorage, removed.state);
  if (historyStorage && !saved.persisted) {
    campaignManageStorageError.hidden = false;
    campaignDeleteConfirmation.hidden = true;
    return false;
  }

  removeCampaignData(historyStorage, removed.campaign.id);
  campaignScopeCache.delete(campaignCacheKey(removed.campaign.id));
  campaignState = saved.state;
  managedCampaignId = null;
  campaignDeleteConfirmation.hidden = true;
  if (wasActive) {
    bindCampaignData(
      null,
      standaloneData,
      t('campaigns.deleted', { name: removed.campaign.name }),
    );
  } else {
    renderCampaignContext();
    renderCampaignDialog();
    campaignStatus.textContent = t('campaigns.deleted', { name: removed.campaign.name });
  }
  setCampaignView('list');
  renderCampaignDialog();
  const selected = campaignsList.querySelector('[aria-current="true"]');
  (selected ?? campaignsSearch).focus();
  return true;
}

function modeLabel(mode) {
  return t(`mode.${mode}`);
}

function modeLowerLabel(mode) {
  if (mode === 'advantage') return t('mode.advantageLower');
  if (mode === 'disadvantage') return t('mode.disadvantageLower');
  return modeLabel(mode).toLowerCase();
}

function modeSelectionLabel(mode) {
  return mode === 'advantage' ? t('mode.highestSelected') : t('mode.lowestSelected');
}

function themeFor(type) {
  return createDiceTheme(type, appSettings.diceColors[type]);
}

function activeDefinition() {
  return getDiceDefinition(activeDieType);
}

function applyDieTheme(element, type) {
  const theme = themeFor(type);
  element.dataset.dieType = type;
  Object.entries(getDiceThemeStyles(theme)).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}

function applyDieIcon(element, type, text = type.toUpperCase()) {
  applyDieTheme(element, type);
  element.classList.remove(...DIE_GLYPH_CLASSES);
  element.classList.add('die-glyph', `glyph-${type}`);
  element.textContent = text;
}

function createDieIcon(className, type, text = type.toUpperCase()) {
  const icon = document.createElement('span');
  icon.className = className;
  applyDieIcon(icon, type, text);
  return icon;
}

function currentPresetConfiguration() {
  return {
    dieType: activeDieType,
    difficultyEnabled,
    criticalsEnabled,
    mode: activeRollMode,
    modifier: activeModifier,
    difficulty: activeDifficulty,
  };
}

function presetSummary(preset) {
  const difficulty = preset.dieType === 'd20'
    ? (preset.difficultyEnabled ? `DC ${preset.difficulty}` : t('check.difficultyOff'))
    : '';
  return t('presets.summary', {
    die: preset.dieType.toUpperCase(),
    mode: modeLabel(preset.mode),
    modifier: formatModifier(preset.modifier),
    difficulty,
  });
}

function recentPresets() {
  return presetLibrary.recentIds
    .map((id) => getPreset(presetLibrary, id))
    .filter(Boolean);
}

function renderPresetShelf() {
  hideTooltip();
  const recent = recentPresets();
  const current = currentPresetConfiguration();
  presetsCountBadge.textContent = String(presetLibrary.presets.length);
  recentPresetsSummary.textContent = t('presets.recentCount', { count: recent.length });
  recentPresetsEmpty.hidden = recent.length > 0;
  recentPresetsEmpty.textContent = t(presetLibrary.presets.length > 0 ? 'presets.noRecent' : 'presets.shelfEmpty');
  recentPresetsList.hidden = recent.length === 0;

  const buttons = recent.map((preset) => {
    const button = document.createElement('button');
    button.className = 'recent-preset-button';
    button.type = 'button';
    button.disabled = rolling;
    applyDieTheme(button, preset.dieType);
    button.setAttribute('aria-pressed', String(
      preset.id === lastAppliedPresetId && presetConfigurationsEqual(preset, current),
    ));
    const summaryCopy = presetSummary(preset);
    const quickApplyDescription = t('presets.quickApplyAria', {
      name: preset.name,
      summary: summaryCopy,
    });
    button.setAttribute('aria-label', quickApplyDescription);
    button.dataset.tooltip = summaryCopy;

    const copy = document.createElement('span');
    copy.className = 'recent-preset-copy';
    const name = document.createElement('strong');
    name.textContent = preset.name;
    copy.append(name);
    const icon = createDieIcon('recent-preset-die', preset.dieType);
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon, copy);
    button.addEventListener('click', () => applyPresetById(preset.id));
    return button;
  });
  recentPresetsList.replaceChildren(...buttons);
}

function setPresetView(view) {
  presetsModal.dataset.view = view;
  presetsBack.hidden = view === 'library';
}

function renderPresetList() {
  const results = searchPresets(presetLibrary, presetsSearch.value);
  const hasPresets = presetLibrary.presets.length > 0;
  presetsSearchSummary.textContent = hasPresets
    ? t('presets.searchResults', { count: results.length })
    : '';
  presetsLibraryEmpty.hidden = hasPresets;
  presetsNoResults.hidden = !hasPresets || results.length > 0;
  presetsList.hidden = results.length === 0;

  const items = results.map((preset) => {
    const item = document.createElement('li');
    item.className = 'preset-library-item';
    applyDieTheme(item, preset.dieType);

    const button = document.createElement('button');
    button.className = 'preset-library-button';
    button.type = 'button';
    button.dataset.presetId = preset.id;
    button.setAttribute('aria-current', String(preset.id === selectedPresetId));

    const copy = document.createElement('span');
    copy.className = 'preset-library-copy';
    const name = document.createElement('strong');
    name.textContent = preset.name;
    const summary = document.createElement('small');
    summary.textContent = presetSummary(preset);
    copy.append(name, summary);
    const arrow = document.createElement('span');
    arrow.className = 'preset-library-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '›';
    button.append(copy, arrow);
    button.addEventListener('click', () => requestPresetAction(() => selectPreset(preset.id)));

    const useButton = document.createElement('button');
    useButton.className = 'preset-library-use';
    useButton.type = 'button';
    useButton.setAttribute('aria-label', t('presets.libraryUseAria', {
      name: preset.name,
      summary: presetSummary(preset),
    }));
    const icon = createDieIcon('preset-library-die', preset.dieType);
    icon.setAttribute('aria-hidden', 'true');
    useButton.append(icon);
    useButton.addEventListener('click', () => requestPresetAction(() => applyPresetById(preset.id)));

    item.append(useButton, button);
    return item;
  });
  presetsList.replaceChildren(...items);
}

function renderPresetPreview() {
  if (presetEditorMode) return;
  const preset = getPreset(presetLibrary, selectedPresetId);
  presetDetailEmpty.hidden = Boolean(preset);
  presetPreview.hidden = !preset;
  presetEditor.hidden = true;
  presetUnsavedConfirmation.hidden = true;
  if (!preset) return;

  applyDieIcon(presetPreviewDie, preset.dieType);
  presetPreviewName.textContent = preset.name;
  presetPreviewSummary.textContent = presetSummary(preset);
  presetPreviewMode.textContent = modeLabel(preset.mode);
  presetPreviewModifier.textContent = formatModifier(preset.modifier);
  const isD20 = preset.dieType === 'd20';
  presetPreviewD20Section.hidden = !isD20;
  if (isD20) {
    presetPreviewDifficulty.textContent = preset.difficultyEnabled
      ? `DC ${preset.difficulty}`
      : t('check.difficultyOff');
    presetPreviewCriticals.textContent = preset.criticalsEnabled ? t('common.on') : t('common.off');
  }
  presetDeleteConfirmation.hidden = true;
}

function renderPresetDialog() {
  presetsDialogSummary.textContent = t('campaigns.scopeSummary', {
    scope: campaignScopeLabel(),
    count: t('presets.count', { count: presetLibrary.presets.length }),
  });
  renderPresetList();
  renderPresetPreview();
}

function selectPreset(id, { showDetail = true, focus = true } = {}) {
  if (!getPreset(presetLibrary, id)) return;
  presetEditorMode = null;
  presetEditorId = null;
  presetEditorInitialSnapshot = null;
  selectedPresetId = id;
  renderPresetDialog();
  if (showDetail) setPresetView('detail');
  if (focus) presetUse.focus();
}

function presetEditorSnapshot() {
  const snapshot = {
    name: presetName.value,
    dieType: presetEditorDieType,
    mode: presetEditorRollMode,
    modifier: presetModifierInput.value,
  };
  if (presetEditorDieType === 'd20') {
    Object.assign(snapshot, {
      difficultyEnabled: presetDifficultyEnabled.checked,
      criticalsEnabled: presetCriticalsEnabled.checked,
      difficulty: presetDifficultyInput.value,
    });
  }
  return JSON.stringify(snapshot);
}

function presetEditorIsDirty() {
  return Boolean(presetEditorMode && presetEditorInitialSnapshot !== presetEditorSnapshot());
}

function renderPresetEditorControls() {
  presetDieOptions.forEach((option) => {
    const selected = option.dataset.presetDie === presetEditorDieType;
    option.setAttribute('aria-checked', String(selected));
    option.tabIndex = selected ? 0 : -1;
  });
  presetModeOptions.forEach((option) => {
    const selected = option.dataset.presetMode === presetEditorRollMode;
    option.setAttribute('aria-checked', String(selected));
    option.tabIndex = selected ? 0 : -1;
  });

  presetModifierDecrease.disabled = presetEditorModifier <= MIN_MODIFIER;
  presetModifierIncrease.disabled = presetEditorModifier >= MAX_MODIFIER;
  const isD20 = presetEditorDieType === 'd20';
  const difficultyActive = isD20 && presetDifficultyEnabled.checked;
  presetCriticalsRow.hidden = !isD20;
  presetDifficultyRow.hidden = !isD20;
  presetDifficultyValueRow.hidden = !isD20;
  presetDifficultyEnabled.disabled = !isD20;
  presetCriticalsEnabled.disabled = !isD20;
  presetDifficultyDecrease.disabled = !difficultyActive || presetEditorDifficulty <= MIN_DIFFICULTY;
  presetDifficultyIncrease.disabled = !difficultyActive || presetEditorDifficulty >= MAX_DIFFICULTY;
  presetDifficultyInput.disabled = !difficultyActive;
  presetDifficultyRow.dataset.enabled = String(isD20 && presetDifficultyEnabled.checked);
  presetCriticalsRow.dataset.enabled = String(isD20 && presetCriticalsEnabled.checked);
  presetDifficultyState.textContent = presetDifficultyEnabled.checked ? t('common.on') : t('common.off');
  presetCriticalsState.textContent = presetCriticalsEnabled.checked ? t('common.on') : t('common.off');
}

function populatePresetEditor(draft) {
  presetName.value = draft.name;
  presetName.removeAttribute('aria-invalid');
  presetNameError.hidden = true;
  presetEditorDieType = draft.dieType;
  presetEditorRollMode = draft.mode;
  presetEditorModifier = draft.modifier;
  presetEditorHasD20Rules = draft.dieType === 'd20';
  presetEditorDifficulty = draft.difficulty ?? DEFAULT_DIFFICULTY;
  presetModifierInput.value = formatModifierInput(presetEditorModifier);
  presetDifficultyInput.value = String(presetEditorDifficulty);
  presetDifficultyEnabled.checked = draft.difficultyEnabled ?? true;
  presetCriticalsEnabled.checked = draft.criticalsEnabled ?? true;
  renderPresetEditorControls();
  presetEditorInitialSnapshot = presetEditorSnapshot();
}

function showPresetEditor(mode, id = null) {
  const source = mode === 'edit'
    ? getPreset(presetLibrary, id)
    : createDefaultPresetDraft(currentPresetConfiguration());
  if (!source) return;

  presetEditorMode = mode;
  presetEditorId = mode === 'edit' ? id : null;
  presetEditorEyebrow.textContent = t(mode === 'edit' ? 'presets.editEyebrow' : 'presets.createEyebrow');
  presetEditorTitle.textContent = t(mode === 'edit' ? 'presets.editTitle' : 'presets.createTitle');
  populatePresetEditor(source);
  presetDetailEmpty.hidden = true;
  presetPreview.hidden = true;
  presetEditor.hidden = false;
  presetUnsavedConfirmation.hidden = true;
  setPresetView('editor');
  requestAnimationFrame(() => presetName.focus());
}

function commitPresetModifierInput() {
  hideTooltip();
  const parsed = parseModifier(presetModifierInput.value);
  if (parsed === null) {
    presetModifierInput.value = formatModifierInput(presetEditorModifier);
    return false;
  }
  presetEditorModifier = parsed;
  presetModifierInput.value = formatModifierInput(parsed);
  renderPresetEditorControls();
  return true;
}

function commitPresetDifficultyInput() {
  hideTooltip();
  const parsed = parseDifficulty(presetDifficultyInput.value);
  if (parsed === null) {
    presetDifficultyInput.value = String(presetEditorDifficulty);
    return false;
  }
  presetEditorDifficulty = parsed;
  presetDifficultyInput.value = String(parsed);
  renderPresetEditorControls();
  return true;
}

function presetDraftFromEditor() {
  const draft = {
    name: normalizePresetName(presetName.value),
    dieType: presetEditorDieType,
    mode: presetEditorRollMode,
    modifier: presetEditorModifier,
  };
  if (presetEditorDieType !== 'd20') return draft;
  return {
    ...draft,
    difficultyEnabled: presetDifficultyEnabled.checked,
    criticalsEnabled: presetCriticalsEnabled.checked,
    difficulty: presetEditorDifficulty,
  };
}

function resetPresetEditorState() {
  presetEditorMode = null;
  presetEditorId = null;
  presetEditorInitialSnapshot = null;
  pendingPresetAction = null;
  presetUnsavedConfirmation.hidden = true;
}

function savePresetEditor({ afterSave = null } = {}) {
  commitPresetModifierInput();
  if (presetEditorDieType === 'd20') commitPresetDifficultyInput();
  const draft = presetDraftFromEditor();
  if (!draft.name) {
    presetName.setAttribute('aria-invalid', 'true');
    presetNameError.hidden = false;
    presetName.focus();
    return false;
  }

  if (presetEditorMode === 'create') {
    const created = createPreset(presetLibrary, draft);
    presetLibrary = savePresets(campaignDataStorage, markPresetUsed(created.library, created.preset.id));
    selectedPresetId = created.preset.id;
    resetPresetEditorState();
    applyPresetConfiguration(created.preset, { statusKey: 'presets.created', recordUse: false });
    closePresetsImmediately();
    return true;
  }

  if (presetEditorMode === 'edit') {
    const updated = updatePreset(presetLibrary, presetEditorId, draft);
    if (!updated.preset) return false;
    presetLibrary = savePresets(campaignDataStorage, updated.library);
    selectedPresetId = updated.preset.id;
    resetPresetEditorState();
    renderPresetShelf();
    renderPresetDialog();
    setPresetView('detail');
    presetsDialogSummary.textContent = t('presets.updated', { name: updated.preset.name });
    if (afterSave) afterSave();
    else presetUse.focus();
    return true;
  }
  return false;
}

function requestPresetAction(action) {
  if (!presetEditorIsDirty()) {
    action();
    return;
  }
  pendingPresetAction = action;
  presetUnsavedConfirmation.hidden = false;
  presetUnsavedSave.focus();
}

function cancelPresetEditor() {
  resetPresetEditorState();
  renderPresetDialog();
  if (selectedPresetId) {
    setPresetView('detail');
    presetUse.focus();
  } else {
    setPresetView('library');
    presetsSearch.focus();
  }
}

function returnToPresetLibrary() {
  resetPresetEditorState();
  renderPresetDialog();
  setPresetView('library');
  const selectedButton = presetsList.querySelector(`[data-preset-id="${CSS.escape(selectedPresetId ?? '')}"]`);
  (selectedButton ?? presetsSearch).focus();
}

function openPresets() {
  if (rolling || presetsDialog.open || campaignsDialog.open || settingsDialog.open || historyDialog.open) return;
  presetsSearch.value = '';
  resetPresetEditorState();
  selectedPresetId = recentPresets()[0]?.id ?? searchPresets(presetLibrary)[0]?.id ?? null;
  setPresetView('library');
  renderPresetDialog();
  presetsDialog.showModal();
  appScene.inert = true;
  document.body.classList.add('presets-is-open');
  presetsOpen.setAttribute('aria-expanded', 'true');
  presetsSearch.focus();
}

function closePresetsImmediately() {
  pendingPresetAction = null;
  if (presetsDialog.open) presetsDialog.close();
}

function requestClosePresets() {
  requestPresetAction(closePresetsImmediately);
}

function handlePresetsClosed() {
  appScene.inert = false;
  document.body.classList.remove('presets-is-open');
  presetsOpen.setAttribute('aria-expanded', 'false');
  resetPresetEditorState();
  presetsOpen.focus();
}

function deleteSelectedPreset() {
  const preset = getPreset(presetLibrary, selectedPresetId);
  if (!preset) return;
  presetLibrary = savePresets(campaignDataStorage, deletePreset(presetLibrary, preset.id));
  if (lastAppliedPresetId === preset.id) lastAppliedPresetId = null;
  const results = searchPresets(presetLibrary, presetsSearch.value);
  selectedPresetId = results[0]?.id ?? null;
  presetApplicationStatus.textContent = t('presets.deleted', { name: preset.name });
  renderPresetShelf();
  renderPresetDialog();
  if (selectedPresetId) {
    setPresetView('detail');
    presetUse.focus();
  } else {
    setPresetView('library');
    (presetLibrary.presets.length > 0 ? presetsSearch : presetsEmptyNew).focus();
  }
}

function resetRollForPresetSelection() {
  hasCompletedRoll = false;
  rollActions.dataset.hasRolled = 'false';
  rollReset.hidden = true;
}

function applyPresetConfiguration(preset, { statusKey = 'presets.applied', recordUse = true } = {}) {
  if (rolling || !preset) return false;
  const nextRollCount = getRollModeDetails(preset.mode).rollCount;
  const currentRollCount = getRollModeDetails(activeRollMode).rollCount;

  if (preset.dieType !== activeDieType && !diceScene.setDie(preset.dieType)) return false;
  if (nextRollCount !== currentRollCount && !diceScene.setDiceCount(nextRollCount)) return false;

  const nextConfiguration = mergePresetConfiguration(currentPresetConfiguration(), preset);
  activeDieType = nextConfiguration.dieType;
  activeRollMode = nextConfiguration.mode;
  activeModifier = nextConfiguration.modifier;
  activeDifficulty = nextConfiguration.difficulty;
  difficultyEnabled = nextConfiguration.difficultyEnabled;
  criticalsEnabled = nextConfiguration.criticalsEnabled;
  lastAppliedPresetId = preset.id;
  if (recordUse) presetLibrary = savePresets(campaignDataStorage, markPresetUsed(presetLibrary, preset.id));

  resetRollForPresetSelection();
  updateSelectedDieUi();
  setArenaStatus('arena.waiting', { die: activeDefinition().label });
  renderPresetShelf();
  renderPresetDialog();
  presetApplicationStatus.textContent = t(statusKey, { name: preset.name });
  return true;
}

function applyPresetById(id) {
  const preset = getPreset(presetLibrary, id);
  if (!applyPresetConfiguration(preset)) return;
  if (presetsDialog.open) closePresetsImmediately();
}

function secureUint32() {
  globalThis.crypto.getRandomValues(randomBuffer);
  return randomBuffer[0];
}

function historyCountLabel(count) {
  return t('history.count', { count });
}

function createHistoryItem(entry) {
  const item = document.createElement('li');
  item.className = 'history-entry';

  const dieBadge = createDieIcon('history-die-badge', entry.dieType);

  const detail = document.createElement('div');
  detail.className = 'history-entry-detail';

  const result = document.createElement('p');
  result.className = 'history-entry-result';
  const resultLabel = document.createElement('span');
  resultLabel.textContent = t('history.result');
  const resultValue = document.createElement('strong');
  const total = applyModifier(entry.value, entry.modifier);
  resultValue.textContent = total;
  result.append(resultLabel, resultValue);

  if (entry.dieType === 'd20') {
    const { state } = getOutcome(entry.value, total, {
      criticalsEnabled: entry.criticalsEnabled,
      difficultyEnabled: entry.difficultyEnabled,
      difficulty: entry.difficulty,
    });
    item.dataset.outcome = state;
    const outcome = document.createElement('span');
    outcome.className = 'history-entry-outcome';
    outcome.textContent = t(`outcome.${state}.label`);
    result.append(outcome);
  }

  const rollDetail = document.createElement('p');
  rollDetail.className = 'history-entry-rolls';
  const rollDetails = [];
  if (entry.mode !== 'normal') {
    const tied = entry.rolls[0] === entry.rolls[1];
    rollDetails.push(t('history.modeDetail', {
      mode: modeLabel(entry.mode),
      rolls: entry.rolls,
      value: entry.value,
      selection: tied ? t('mode.equal') : modeSelectionLabel(entry.mode),
    }));
  }
  if (entry.modifier !== 0) rollDetails.push(formatModifiedTotal(entry.value, entry.modifier));
  if (entry.dieType === 'd20') {
    rollDetails.push(entry.difficultyEnabled ? `DC ${entry.difficulty}` : t('check.difficultyOff'));
    if (!entry.criticalsEnabled) rollDetails.push(t('check.criticalsOff'));
  }
  rollDetail.hidden = rollDetails.length === 0;
  rollDetail.textContent = rollDetails.join(' · ');

  const timestamp = document.createElement('time');
  const date = new Date(entry.rolledAt);
  timestamp.dateTime = date.toISOString();
  timestamp.textContent = historyDateFormatter.format(date);
  detail.append(result, rollDetail, timestamp);
  item.append(dieBadge, detail);
  return item;
}

function resetClearConfirmation() {
  historyClear.hidden = false;
  historyClearConfirmation.hidden = true;
}

function renderHistory() {
  historySummary.textContent = t('campaigns.scopeSummary', {
    scope: campaignScopeLabel(),
    count: historyCountLabel(rollHistory.length),
  });
  historyList.replaceChildren(...rollHistory.map(createHistoryItem));
  historyList.hidden = rollHistory.length === 0;
  historyEmpty.hidden = rollHistory.length > 0;
  historyFooter.hidden = rollHistory.length === 0;
  if (rollHistory.length === 0) resetClearConfirmation();
}

function openHistory() {
  if (historyDialog.open || campaignsDialog.open || settingsDialog.open || presetsDialog.open) return;
  resetClearConfirmation();
  renderHistory();
  historyDialog.showModal();
  appScene.inert = true;
  document.body.classList.add('history-is-open');
  historyOpen.setAttribute('aria-expanded', 'true');
  historyClose.focus();
}

function closeHistory() {
  if (historyDialog.open) historyDialog.close();
}

function handleHistoryClosed() {
  appScene.inert = false;
  document.body.classList.remove('history-is-open');
  historyOpen.setAttribute('aria-expanded', 'false');
  resetClearConfirmation();
  historyOpen.focus();
}

function applyStaticTranslations() {
  document.documentElement.lang = appSettings.language;
  document.title = t('meta.title');
  metaDescription.content = t('meta.description');
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
  });
  document.querySelectorAll('[data-i18n-tooltip]').forEach((element) => {
    element.dataset.tooltip = t(element.dataset.i18nTooltip);
  });

  document.querySelector('.dice-options').setAttribute('aria-label', t('dice.type'));
  outcomePanel.setAttribute('aria-label', t('outcome.region'));
  modifierDecrease.setAttribute('aria-label', t('modifier.decrease'));
  modifierIncrease.setAttribute('aria-label', t('modifier.increase'));
  modifierInput.setAttribute('aria-label', t('modifier.range'));
  difficultyDecrease.setAttribute('aria-label', t('check.decreaseDifficulty'));
  difficultyIncrease.setAttribute('aria-label', t('check.increaseDifficulty'));
  difficultyInput.setAttribute('aria-label', t('check.difficultyRange'));
  dieOptions.forEach((option) => option.setAttribute('aria-label', t('dice.select', {
    die: option.dataset.dieType.toUpperCase(),
  })));
}

function tooltipIsOpen() {
  return hoverTooltip.matches(':popover-open');
}

function clearTooltipTimeout() {
  if (tooltipShowTimeout === null) return;
  window.clearTimeout(tooltipShowTimeout);
  tooltipShowTimeout = null;
}

function removeTooltipDescription(target) {
  if (!target) return;
  const describedBy = (target.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter((id) => id && id !== hoverTooltip.id);
  if (describedBy.length > 0) target.setAttribute('aria-describedby', describedBy.join(' '));
  else target.removeAttribute('aria-describedby');
}

function resetExpressionTooltipMode() {
  removeTooltipDescription(expressionTooltipTarget);
  expressionTooltipTarget = null;
  delete hoverTooltip.dataset.mode;
  hoverTooltip.removeAttribute('aria-live');
  hoverTooltip.removeAttribute('aria-atomic');
}

function hideTooltip() {
  clearTooltipTimeout();
  tooltipTarget = null;
  resetExpressionTooltipMode();
  if (tooltipIsOpen()) hoverTooltip.hidePopover();
}

function positionTooltip(target) {
  const position = calculateTooltipPosition(
    target.getBoundingClientRect(),
    hoverTooltip.getBoundingClientRect(),
    { width: window.innerWidth, height: window.innerHeight },
  );
  hoverTooltip.style.left = `${position.left}px`;
  hoverTooltip.style.top = `${position.top}px`;
  hoverTooltip.dataset.placement = position.placement;
}

function mountTooltip(target) {
  const host = target.closest('dialog') ?? document.body;
  if (hoverTooltip.parentElement !== host) {
    if (tooltipIsOpen()) hoverTooltip.hidePopover();
    host.append(hoverTooltip);
  }
  hoverTooltip.style.left = '0px';
  hoverTooltip.style.top = '0px';
  if (!tooltipIsOpen()) hoverTooltip.showPopover();
  positionTooltip(target);
}

function showTooltip(target) {
  if (expressionTooltipTarget) return;
  const copy = target?.dataset.tooltip?.trim();
  clearTooltipTimeout();
  if (!copy || !target.isConnected) {
    hideTooltip();
    return;
  }

  tooltipTarget = target;
  hoverTooltip.textContent = copy;
  mountTooltip(target);
}

function showExpressionTooltip(target, expression, resultCopy) {
  clearTooltipTimeout();
  if (!target.isConnected) {
    hideTooltip();
    return;
  }

  if (expressionTooltipTarget !== target) removeTooltipDescription(expressionTooltipTarget);
  expressionTooltipTarget = target;
  tooltipTarget = target;
  hoverTooltip.dataset.mode = 'expression';
  hoverTooltip.setAttribute('aria-live', 'polite');
  hoverTooltip.setAttribute('aria-atomic', 'true');

  const expressionLine = document.createElement('span');
  expressionLine.className = 'expression-tooltip-expression';
  expressionLine.textContent = expression || '\u00a0';
  const resultLine = document.createElement('span');
  resultLine.className = 'expression-tooltip-result';
  resultLine.textContent = resultCopy;
  hoverTooltip.replaceChildren(expressionLine, resultLine);

  const describedBy = new Set((target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
  describedBy.add(hoverTooltip.id);
  target.setAttribute('aria-describedby', [...describedBy].join(' '));
  mountTooltip(target);
}

function scheduleTooltip(target) {
  if (expressionTooltipTarget) return;
  hideTooltip();
  tooltipTarget = target;
  tooltipShowTimeout = window.setTimeout(() => {
    tooltipShowTimeout = null;
    if (tooltipTarget === target) showTooltip(target);
  }, TOOLTIP_DELAY_MS);
}

function tooltipTriggerFromEvent(event) {
  return event.target instanceof Element ? event.target.closest('[data-tooltip]') : null;
}

document.addEventListener('pointerover', (event) => {
  if (expressionTooltipTarget) return;
  if (event.pointerType === 'touch') return;
  const target = tooltipTriggerFromEvent(event);
  if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
  scheduleTooltip(target);
});

document.addEventListener('pointerdown', () => {
  keyboardTooltipFocus = false;
}, true);

document.addEventListener('keydown', (event) => {
  if (!event.metaKey && !event.ctrlKey && !event.altKey) keyboardTooltipFocus = true;
}, true);

document.addEventListener('pointerout', (event) => {
  if (expressionTooltipTarget) return;
  const target = tooltipTriggerFromEvent(event);
  if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
  if (target === tooltipTarget) hideTooltip();
});

document.addEventListener('focusin', (event) => {
  if (expressionTooltipTarget) return;
  if (!keyboardTooltipFocus || !(event.target instanceof Element)) return;
  const target = event.target.closest('[data-tooltip]');
  if (target) showTooltip(target);
});

document.addEventListener('focusout', (event) => {
  const target = tooltipTriggerFromEvent(event);
  if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
  if (target === tooltipTarget) hideTooltip();
});

document.addEventListener('click', (event) => {
  if (expressionTooltipTarget && event.target === expressionTooltipTarget) return;
  hideTooltip();
});

function handleTooltipViewportChange() {
  if (expressionTooltipTarget && document.activeElement === expressionTooltipTarget) {
    positionTooltip(expressionTooltipTarget);
    return;
  }
  hideTooltip();
}

window.addEventListener('scroll', handleTooltipViewportChange, true);
window.addEventListener('resize', handleTooltipViewportChange);

function setArenaStatus(key, parameters = {}) {
  currentArenaStatus = { key, parameters };
  arenaStatus.textContent = t(key, parameters);
}

function renderArenaStatus() {
  arenaStatus.textContent = t(currentArenaStatus.key, currentArenaStatus.parameters);
}

function resetSettingsConfirmation() {
  settingsReset.hidden = false;
  settingsResetConfirmation.hidden = true;
}

function applyThemeToDom(type) {
  document.querySelectorAll(`[data-die-type="${type}"]`).forEach((element) => applyDieTheme(element, type));
  settingsDieOptions
    .filter((option) => option.dataset.settingsDie === type)
    .forEach((option) => applyDieTheme(option, type));
  if (activeDieType === type) applyDieTheme(document.body, type);
}

function applyThemeToScene(type) {
  diceScene?.setDiceTheme(type, themeFor(type));
}

function renderSettings() {
  languageOptions.forEach((option) => {
    const selected = option.dataset.language === appSettings.language;
    option.setAttribute('aria-checked', String(selected));
    option.tabIndex = selected ? 0 : -1;
  });
  fpsOptions.forEach((option) => {
    const selected = option.dataset.fps === appSettings.fps;
    option.setAttribute('aria-checked', String(selected));
    option.tabIndex = selected ? 0 : -1;
    option.setAttribute('aria-label', option.dataset.fps === 'auto'
      ? t('settings.auto')
      : t('settings.fpsOption', { fps: option.dataset.fps }));
  });

  settingsSound.checked = appSettings.soundEnabled;
  settingsSoundRow.dataset.enabled = String(appSettings.soundEnabled);
  settingsSoundState.textContent = appSettings.soundEnabled ? t('common.on') : t('common.off');

  settingsDieOptions.forEach((option) => {
    const type = option.dataset.settingsDie;
    const selected = type === settingsDieType;
    applyDieTheme(option, type);
    option.setAttribute('aria-checked', String(selected));
    option.setAttribute('aria-label', t('dice.select', { die: type.toUpperCase() }));
    option.tabIndex = selected ? 0 : -1;
  });

  const palette = appSettings.diceColors[settingsDieType];
  Object.entries(settingsColorInputs).forEach(([part, input]) => {
    input.value = palette[part];
    input.nextElementSibling.value = palette[part];
    input.setAttribute('aria-label', t('settings.colorAria', {
      part: t(`settings.${part}`),
      die: settingsDieType.toUpperCase(),
    }));
  });
  applyDieIcon(settingsDiePreview, settingsDieType, settingsDieType.slice(1));
  settingsDiePreview.setAttribute('aria-label', t('settings.preview', { die: settingsDieType.toUpperCase() }));
}

function setLanguage(language, { focus = false } = {}) {
  if (!['sv', 'en'].includes(language) || language === appSettings.language) {
    renderSettings();
    return;
  }
  appSettings = saveSettings(historyStorage, { ...appSettings, language });
  historyDateFormatter = new Intl.DateTimeFormat(localeForLanguage(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  applyStaticTranslations();
  renderCampaignContext();
  renderCampaignDialog();
  updateSelectedDieUi({ clearResult: false });
  renderCurrentOutcome();
  renderHistory();
  renderSettings();
  renderArenaStatus();
  if (focus) languageOptions.find((option) => option.dataset.language === language)?.focus();
}

function setFps(fps, { focus = false } = {}) {
  if (!SUPPORTED_FPS.includes(fps)) return;
  appSettings = saveSettings(historyStorage, { ...appSettings, fps });
  diceScene?.setFps(fps);
  renderSettings();
  if (focus) fpsOptions.find((option) => option.dataset.fps === fps)?.focus();
}

function setSettingsDie(type, { focus = false } = {}) {
  if (!DICE_TYPES.includes(type)) return;
  settingsDieType = type;
  renderSettings();
  if (focus) settingsDieOptions.find((option) => option.dataset.settingsDie === type)?.focus();
}

function setPaletteColor(part, value, { immediate = false } = {}) {
  const normalized = value.toUpperCase();
  appSettings = saveSettings(historyStorage, {
    ...appSettings,
    diceColors: {
      ...appSettings.diceColors,
      [settingsDieType]: { ...appSettings.diceColors[settingsDieType], [part]: normalized },
    },
  });
  settingsColorInputs[part].nextElementSibling.value = normalized;
  applyThemeToDom(settingsDieType);
  renderSettings();

  const type = settingsDieType;
  window.clearTimeout(paletteUpdateTimeouts.get(type));
  if (immediate) {
    paletteUpdateTimeouts.delete(type);
    applyThemeToScene(type);
  } else {
    paletteUpdateTimeouts.set(type, window.setTimeout(() => {
      paletteUpdateTimeouts.delete(type);
      applyThemeToScene(type);
    }, 90));
  }
}

function applyResetSettings() {
  paletteUpdateTimeouts.forEach((timeout) => window.clearTimeout(timeout));
  paletteUpdateTimeouts.clear();
  appSettings = resetSettings(historyStorage);
  historyDateFormatter = new Intl.DateTimeFormat(localeForLanguage(appSettings.language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  applyStaticTranslations();
  DICE_TYPES.forEach((type) => {
    applyThemeToDom(type);
    applyThemeToScene(type);
  });
  diceScene?.setFps(appSettings.fps);
  updateSelectedDieUi({ clearResult: false });
  renderCurrentOutcome();
  renderHistory();
  renderSettings();
  renderArenaStatus();
  resetSettingsConfirmation();
  settingsClose.focus();
}

function openSettings() {
  if (settingsDialog.open || campaignsDialog.open || historyDialog.open || presetsDialog.open) return;
  resetSettingsConfirmation();
  renderSettings();
  settingsDialog.showModal();
  appScene.inert = true;
  document.body.classList.add('settings-is-open');
  settingsOpen.setAttribute('aria-expanded', 'true');
  settingsClose.focus();
}

function closeSettings() {
  if (settingsDialog.open) settingsDialog.close();
}

function handleSettingsClosed() {
  appScene.inert = false;
  document.body.classList.remove('settings-is-open');
  settingsOpen.setAttribute('aria-expanded', 'false');
  resetSettingsConfirmation();
  settingsOpen.focus();
}

function handleRadioArrow(event, options, selectedIndex, select) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
  select((selectedIndex + direction + options.length) % options.length);
}

function setPresetEditorDie(type, { focus = false } = {}) {
  if (!DICE_TYPES.includes(type)) return;
  if (type === 'd20' && presetEditorDieType !== 'd20' && !presetEditorHasD20Rules) {
    presetEditorHasD20Rules = true;
    presetEditorDifficulty = DEFAULT_DIFFICULTY;
    presetDifficultyInput.value = String(DEFAULT_DIFFICULTY);
    presetDifficultyEnabled.checked = true;
    presetCriticalsEnabled.checked = true;
  }
  presetEditorDieType = type;
  renderPresetEditorControls();
  if (focus) presetDieOptions.find((option) => option.dataset.presetDie === type)?.focus();
}

function setPresetEditorMode(mode, { focus = false } = {}) {
  if (!['normal', 'advantage', 'disadvantage'].includes(mode)) return;
  presetEditorRollMode = mode;
  renderPresetEditorControls();
  if (focus) presetModeOptions.find((option) => option.dataset.presetMode === mode)?.focus();
}

function createRollAttempts() {
  return Array.from({ length: getRollModeDetails(activeRollMode).rollCount }, () => {
    const seedWords = new Uint32Array(4);
    globalThis.crypto.getRandomValues(seedWords);
    return {
      seedWords: Array.from(seedWords),
      fallbackValue: getSecureRoll(activeDefinition().sides, secureUint32),
    };
  });
}

function resetOutcomeClasses() {
  outcomePanel.classList.remove('success', 'failure', 'critical', 'critical-failure', 'neutral');
}

function showOutcome({
  value,
  rolls = [value],
  mode = 'normal',
  modifier = 0,
  allowCriticals = true,
  useDifficulty = true,
  difficulty = DEFAULT_DIFFICULTY,
}, { remember = true } = {}) {
  if (remember) outcomePresentation = {
    kind: 'result',
    arguments: { value, rolls, mode, modifier, allowCriticals, useDifficulty, difficulty },
  };
  const total = applyModifier(value, modifier);
  resetOutcomeClasses();
  rollValue.textContent = total;
  const breakdownParts = [];
  if (mode !== 'normal') {
    const tied = rolls[0] === rolls[1];
    breakdownParts.push(t('roll.breakdown', {
      rolls,
      selection: tied ? t('mode.equal') : modeSelectionLabel(mode),
    }));
  }
  if (modifier !== 0) breakdownParts.push(formatModifiedTotal(value, modifier));
  rollBreakdown.hidden = breakdownParts.length === 0;
  rollBreakdown.textContent = breakdownParts.join(' · ');

  if (activeDieType === 'd20') {
    const { state } = getOutcome(value, total, {
      criticalsEnabled: allowCriticals,
      difficultyEnabled: useDifficulty,
      difficulty,
    });
    outcomeLabel.textContent = t(`outcome.${state}.label`);
    outcomeText.textContent = t(`outcome.${state}.text`);
    outcomePanel.classList.toggle('success', state === 'critical' || state === 'success');
    outcomePanel.classList.toggle('failure', state === 'failure' || state === 'criticalFailure');
    outcomePanel.classList.toggle('critical', state === 'critical');
    outcomePanel.classList.toggle('critical-failure', state === 'criticalFailure');
    outcomePanel.classList.toggle('neutral', state === 'neutral');
    return;
  }

  const label = activeDefinition().label;
  outcomePanel.classList.add('neutral');
  outcomeLabel.textContent = t('roll.genericOutcome', { die: label });
  if (modifier !== 0) {
    outcomeText.textContent = t('roll.genericModified', { die: label, value, total });
  } else {
    outcomeText.textContent = mode === 'normal'
      ? t('roll.genericNormal', { die: label, value })
      : t('roll.genericMode', {
        choice: mode === 'advantage' ? t('roll.highest') : t('roll.lowest'),
        die: label,
      });
  }
}

function clearOutcomeForSelection({ remember = true } = {}) {
  if (remember) outcomePresentation = { kind: 'ready' };
  const label = activeDefinition().label;
  resetOutcomeClasses();
  outcomePanel.classList.add('neutral');
  rollValue.textContent = '—';
  rollBreakdown.hidden = true;
  outcomeLabel.textContent = t('roll.ready');
  outcomeText.textContent = t('roll.readyText', { die: label });
}

function showRollingOutcome({ remember = true } = {}) {
  if (remember) outcomePresentation = { kind: 'rolling' };
  resetOutcomeClasses();
  outcomePanel.classList.add('neutral');
  rollBreakdown.hidden = true;
  outcomeLabel.textContent = t('roll.deciding');
  outcomeText.textContent = t('roll.falling', {
    die: activeDefinition().label,
    plural: getRollModeDetails(activeRollMode).rollCount === 2,
  });
}

function renderCurrentOutcome() {
  if (outcomePresentation.kind === 'result') {
    showOutcome(outcomePresentation.arguments, { remember: false });
  } else if (outcomePresentation.kind === 'rolling') {
    showRollingOutcome({ remember: false });
  } else {
    clearOutcomeForSelection({ remember: false });
  }
}

function updateRollButtonCopy(active = false) {
  const label = activeDefinition().label;
  if (active) {
    rollAgain.querySelector('.button-copy').textContent = t('roll.rolling', {
      die: label,
      plural: getRollModeDetails(activeRollMode).rollCount === 2,
    });
    return;
  }
  if (hasCompletedRoll) {
    rollAgain.querySelector('.button-copy').textContent = t('roll.again');
    rollAgain.setAttribute('aria-label', t('roll.againAria', {
      die: label,
      mode: modeLowerLabel(activeRollMode),
      modifier: formatModifier(activeModifier),
    }));
    return;
  }
  rollAgain.querySelector('.button-copy').textContent = activeRollMode === 'normal'
    ? t('roll.roll', { die: label })
    : t('roll.rollWithMode', { die: label, mode: modeLowerLabel(activeRollMode) });
  rollAgain.setAttribute('aria-label', t('roll.withModifierAria', {
    copy: rollAgain.querySelector('.button-copy').textContent,
    modifier: formatModifier(activeModifier),
  }));
}

function updateRollModeUi() {
  const nextMode = nextRollMode(activeRollMode);
  rollModeButton.dataset.mode = activeRollMode;
  rollModeValue.textContent = modeLabel(activeRollMode);
  rollModeButton.setAttribute('aria-label', t('mode.cycleAria', {
    current: modeLabel(activeRollMode),
    next: modeLabel(nextMode),
  }));
}

function updateModifierUi() {
  const formatted = formatModifierInput(activeModifier);
  modifierInput.value = formatted;
  modifierInput.setAttribute('aria-valuenow', String(activeModifier));
  modifierInput.setAttribute('aria-valuetext', t('modifier.value', { value: formatted }));
  modifierDecrease.disabled = rolling || activeModifier <= MIN_MODIFIER;
  modifierIncrease.disabled = rolling || activeModifier >= MAX_MODIFIER;
  modifierInput.disabled = rolling;
}

function updateDifficultyUi(isD20 = activeDieType === 'd20') {
  difficultyControl.hidden = !isD20;
  difficultyToggleRow.hidden = !isD20;
  difficultyToggle.checked = difficultyEnabled;
  difficultyToggle.disabled = rolling;
  difficultyToggleRow.dataset.enabled = String(difficultyEnabled);
  difficultyControl.dataset.enabled = String(difficultyEnabled);
  difficultyToggleState.textContent = difficultyEnabled ? t('common.on') : t('common.off');
  difficultyInput.value = String(activeDifficulty);
  difficultyInput.setAttribute('aria-valuenow', String(activeDifficulty));
  difficultyInput.setAttribute('aria-valuetext', t('check.difficultyValue', { value: activeDifficulty }));
  difficultyDecrease.disabled = rolling || !difficultyEnabled || activeDifficulty <= MIN_DIFFICULTY;
  difficultyIncrease.disabled = rolling || !difficultyEnabled || activeDifficulty >= MAX_DIFFICULTY;
  difficultyInput.disabled = rolling || !difficultyEnabled;
}

function updateCriticalsUi(isD20 = activeDieType === 'd20') {
  criticalToggleRow.hidden = !isD20;
  criticalToggle.checked = criticalsEnabled;
  criticalToggle.disabled = rolling;
  criticalToggleRow.dataset.enabled = String(criticalsEnabled);
  criticalToggleState.textContent = criticalsEnabled ? t('common.on') : t('common.off');
  rollMeta.hidden = !isD20;
  criticalMetaEnabled.hidden = !criticalsEnabled;
  criticalMetaDisabled.hidden = criticalsEnabled;
}

function updateSelectedDieUi({ clearResult = true } = {}) {
  const definition = activeDefinition();
  const label = definition.label;
  applyDieTheme(document.body, activeDieType);
  arenaEyebrow.textContent = t('arena.eyebrow', { die: label });
  const modeDetails = getRollModeDetails(activeRollMode);
  dieButton.setAttribute(
    'aria-label',
    activeRollMode === 'normal'
      ? t('arena.rollSingle', { die: label })
      : t('arena.rollDouble', { die: label, mode: modeLowerLabel(activeRollMode) }),
  );
  fallbackDice.forEach((die) => applyDieTheme(die, activeDieType));

  dieOptions.forEach((option) => {
    const selected = option.dataset.dieType === activeDieType;
    option.classList.toggle('is-selected', selected);
    option.setAttribute('aria-checked', String(selected));
    option.tabIndex = selected ? 0 : -1;
  });

  const isD20 = activeDieType === 'd20';
  updateRollModeUi();
  updateModifierUi();
  updateDifficultyUi(isD20);
  updateCriticalsUi(isD20);
  updateRollButtonCopy();
  renderPresetShelf();
  if (clearResult) clearOutcomeForSelection();
}

function setRollingState(active) {
  rolling = active;
  dieButton.disabled = active;
  rollAgain.disabled = active;
  rollReset.disabled = active;
  rollModeButton.disabled = active;
  campaignsOpen.disabled = active;
  presetsOpen.disabled = active;
  dieOptions.forEach((option) => { option.disabled = active; });
  diceViewport.classList.toggle('is-rolling', active);
  document.body.classList.toggle('is-rolling', active);
  updateModifierUi();
  updateDifficultyUi();
  updateCriticalsUi();
  updateRollButtonCopy(active);
  renderPresetShelf();
}

function handleSceneState(state) {
  diceViewport.dataset.state = state;
  const label = activeDefinition().label;
  const plural = getRollModeDetails(activeRollMode).rollCount === 2;
  if (state === 'throwing') setArenaStatus('arena.throwing', { die: label, plural });
  else if (state === 'settling' || state === 'correcting') setArenaStatus('arena.landing', { die: label, plural });
  else if (state === 'recentering') setArenaStatus('arena.recentering', { die: label, plural });
  else if (state === 'complete') setArenaStatus('arena.complete');
  else setArenaStatus('arena.waiting', { die: label });
}

function finishRoll(rolls) {
  const resolved = resolveRoll(activeRollMode, rolls);
  const total = applyModifier(resolved.value, activeModifier);
  showOutcome({
    ...resolved,
    rolls,
    mode: activeRollMode,
    modifier: activeModifier,
    allowCriticals: criticalsEnabled,
    useDifficulty: difficultyEnabled,
    difficulty: activeDifficulty,
  });
  diceScene.highlightDice(resolved.selectedIndices);
  rollHistory = addHistoryEntry(campaignDataStorage, rollHistory, {
    dieType: activeDieType,
    value: resolved.value,
    rolledAt: Date.now(),
    mode: activeRollMode,
    rolls,
    modifier: activeModifier,
    criticalsEnabled,
    difficulty: activeDifficulty,
    difficultyEnabled,
  });
  renderHistory();
  hasCompletedRoll = true;
  rollActions.dataset.hasRolled = 'true';
  rollReset.hidden = false;
  setRollingState(false);
  setArenaStatus('arena.result', { total });
}

function initializeScene() {
  const callbacks = { onSettled: finishRoll, onStateChange: handleSceneState };
  try {
    diceScene = new DiceScene({ canvas, getTheme: themeFor, ...callbacks });
    diceScene.setFps(appSettings.fps);
    requestAnimationFrame(() => sceneLoading.classList.add('is-hidden'));
  } catch (error) {
    console.error('WebGL dice scene unavailable; using the static fallback.', error);
    diceViewport.classList.add('webgl-fallback');
    canvas.hidden = true;
    sceneLoading.classList.add('is-hidden');
    diceScene = new StaticDiceFallback({
      diceElements: fallbackDice,
      applyTheme: applyDieTheme,
      ...callbacks,
    });
    diceScene.setDie(activeDieType);
    diceScene.setDiceCount(getRollModeDetails(activeRollMode).rollCount);
    diceScene.setFps(appSettings.fps);
  }
}

function selectDie(type, { focus = false } = {}) {
  if (rolling || type === activeDieType) return;
  if (!DICE_TYPES.includes(type) || !diceScene.setDie(type)) return;
  activeDieType = type;
  updateSelectedDieUi();
  setArenaStatus('arena.waiting', { die: activeDefinition().label });
  if (focus) dieOptions.find((option) => option.dataset.dieType === type)?.focus();
}

function rollDie() {
  if (rolling) return;
  const attempts = createRollAttempts();
  setRollingState(true);
  diceScene.highlightDice([]);
  showRollingOutcome();
  setArenaStatus('arena.starting');
  if (!diceScene.roll({ attempts })) setRollingState(false);
}

function cycleRollMode() {
  if (rolling) return;
  const nextMode = nextRollMode(activeRollMode);
  if (!diceScene.setDiceCount(getRollModeDetails(nextMode).rollCount)) return;
  activeRollMode = nextMode;
  updateSelectedDieUi();
  setArenaStatus('arena.waiting', { die: activeDefinition().label });
}

function setModifier(modifier, { clearResult = true } = {}) {
  if (rolling || modifier === activeModifier) {
    updateModifierUi();
    return;
  }
  activeModifier = modifier;
  updateSelectedDieUi({ clearResult });
  setArenaStatus('arena.waiting', { die: activeDefinition().label });
}

function commitModifierInput() {
  hideTooltip();
  const parsed = parseModifier(modifierInput.value);
  if (parsed === null) {
    updateModifierUi();
    return false;
  }
  setModifier(parsed);
  return true;
}

function setDifficulty(difficulty, { clearResult = true } = {}) {
  if (rolling || !difficultyEnabled || difficulty === activeDifficulty) {
    updateDifficultyUi();
    return;
  }
  activeDifficulty = difficulty;
  updateSelectedDieUi({ clearResult });
  setArenaStatus('arena.waiting', { die: activeDefinition().label });
}

function commitDifficultyInput() {
  hideTooltip();
  const parsed = parseDifficulty(difficultyInput.value);
  if (parsed === null) {
    updateDifficultyUi();
    return false;
  }
  setDifficulty(parsed);
  return true;
}

function startFreshRoll() {
  if (rolling) return;
  if (activeRollMode !== 'normal' && !diceScene.setDiceCount(1)) return;
  activeRollMode = 'normal';
  activeModifier = 0;
  updateSelectedDieUi();
  setArenaStatus('arena.waiting', { die: activeDefinition().label });
  rollDie();
}

dieOptions.forEach((option) => {
  applyDieTheme(option, option.dataset.dieType);
  option.addEventListener('click', () => selectDie(option.dataset.dieType));
  option.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const currentIndex = DICE_TYPES.indexOf(activeDieType);
    selectDie(DICE_TYPES[(currentIndex + direction + DICE_TYPES.length) % DICE_TYPES.length], { focus: true });
  });
});

dieButton.addEventListener('click', rollDie);
rollAgain.addEventListener('click', rollDie);
rollReset.addEventListener('click', startFreshRoll);
rollModeButton.addEventListener('click', cycleRollMode);
rollModeButton.addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key) || event.repeat) return;
  event.preventDefault();
  cycleRollMode();
});
arithmeticInputConfigurations.forEach((_configuration, input) => {
  input.addEventListener('input', handleArithmeticInput);
});
modifierDecrease.addEventListener('click', () => setModifier(Math.max(MIN_MODIFIER, activeModifier - 1)));
modifierIncrease.addEventListener('click', () => setModifier(Math.min(MAX_MODIFIER, activeModifier + 1)));
modifierInput.addEventListener('focus', () => modifierInput.select());
modifierInput.addEventListener('blur', commitModifierInput);
modifierInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    hideTooltip();
    const direction = event.key === 'ArrowUp' ? 1 : -1;
    setModifier(Math.min(MAX_MODIFIER, Math.max(MIN_MODIFIER, activeModifier + direction)));
    modifierInput.focus();
    modifierInput.select();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    commitModifierInput();
    modifierInput.blur();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    hideTooltip();
    updateModifierUi();
    modifierInput.blur();
  }
});
difficultyDecrease.addEventListener('click', () => setDifficulty(Math.max(MIN_DIFFICULTY, activeDifficulty - 1)));
difficultyIncrease.addEventListener('click', () => setDifficulty(Math.min(MAX_DIFFICULTY, activeDifficulty + 1)));
difficultyInput.addEventListener('focus', () => difficultyInput.select());
difficultyInput.addEventListener('blur', commitDifficultyInput);
difficultyInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    hideTooltip();
    const direction = event.key === 'ArrowUp' ? 1 : -1;
    setDifficulty(Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, activeDifficulty + direction)));
    difficultyInput.focus();
    difficultyInput.select();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    commitDifficultyInput();
    difficultyInput.blur();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    hideTooltip();
    updateDifficultyUi();
    difficultyInput.blur();
  }
});
difficultyToggle.addEventListener('change', () => {
  if (rolling) return;
  difficultyEnabled = difficultyToggle.checked;
  updateSelectedDieUi();
  setArenaStatus('arena.waiting', { die: activeDefinition().label });
});
criticalToggle.addEventListener('change', () => {
  if (rolling) return;
  criticalsEnabled = criticalToggle.checked;
  updateSelectedDieUi();
  setArenaStatus('arena.waiting', { die: activeDefinition().label });
});
campaignsOpen.addEventListener('click', openCampaigns);
campaignsClose.addEventListener('click', closeCampaigns);
campaignsBack.addEventListener('click', returnToCampaignList);
campaignsNew.addEventListener('click', showCampaignCreate);
campaignsSearch.addEventListener('input', renderCampaignList);
campaignCreateCancel.addEventListener('click', returnToCampaignList);
campaignCreate.addEventListener('submit', (event) => {
  event.preventDefault();
  createCampaignFromEditor();
});
campaignCreateName.addEventListener('input', () => {
  resetCampaignField(campaignCreateName, campaignCreateError, campaignCreateStorageError);
});
campaignManage.addEventListener('submit', (event) => {
  event.preventDefault();
  renameManagedCampaign();
});
campaignManageName.addEventListener('input', () => {
  resetCampaignField(campaignManageName, campaignManageError, campaignManageStorageError);
});
campaignDelete.addEventListener('click', () => {
  renderCampaignManager();
  campaignDeleteConfirmation.hidden = false;
  campaignConfirmDelete.focus();
});
campaignCancelDelete.addEventListener('click', () => {
  campaignDeleteConfirmation.hidden = true;
  campaignDelete.focus();
});
campaignConfirmDelete.addEventListener('click', deleteManagedCampaign);
campaignsDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeCampaigns();
});
campaignsDialog.addEventListener('click', (event) => {
  if (event.target === campaignsDialog) closeCampaigns();
});
campaignsDialog.addEventListener('close', handleCampaignsClosed);
presetsOpen.addEventListener('click', openPresets);
presetsClose.addEventListener('click', requestClosePresets);
presetsBack.addEventListener('click', () => requestPresetAction(returnToPresetLibrary));
presetsNew.addEventListener('click', () => requestPresetAction(() => showPresetEditor('create')));
presetsEmptyNew.addEventListener('click', () => showPresetEditor('create'));
presetsSearch.addEventListener('input', renderPresetList);
presetsDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  requestClosePresets();
});
presetsDialog.addEventListener('click', (event) => {
  if (event.target === presetsDialog) requestClosePresets();
});
presetsDialog.addEventListener('close', handlePresetsClosed);
presetUse.addEventListener('click', () => applyPresetById(selectedPresetId));
presetEdit.addEventListener('click', () => showPresetEditor('edit', selectedPresetId));
presetDelete.addEventListener('click', () => {
  presetDeleteConfirmation.hidden = false;
  presetConfirmDelete.focus();
});
presetCancelDelete.addEventListener('click', () => {
  presetDeleteConfirmation.hidden = true;
  presetDelete.focus();
});
presetConfirmDelete.addEventListener('click', deleteSelectedPreset);
presetEditor.addEventListener('submit', (event) => {
  event.preventDefault();
  savePresetEditor();
});
presetEditorCancel.addEventListener('click', () => requestPresetAction(cancelPresetEditor));
presetName.addEventListener('input', () => {
  presetName.removeAttribute('aria-invalid');
  presetNameError.hidden = true;
});
presetDieOptions.forEach((option, index) => {
  applyDieTheme(option, option.dataset.presetDie);
  option.addEventListener('click', () => setPresetEditorDie(option.dataset.presetDie));
  option.addEventListener('keydown', (event) => handleRadioArrow(
    event,
    presetDieOptions,
    index,
    (nextIndex) => setPresetEditorDie(presetDieOptions[nextIndex].dataset.presetDie, { focus: true }),
  ));
});
presetModeOptions.forEach((option, index) => {
  option.addEventListener('click', () => setPresetEditorMode(option.dataset.presetMode));
  option.addEventListener('keydown', (event) => handleRadioArrow(
    event,
    presetModeOptions,
    index,
    (nextIndex) => setPresetEditorMode(presetModeOptions[nextIndex].dataset.presetMode, { focus: true }),
  ));
});
presetModifierDecrease.addEventListener('click', () => {
  presetEditorModifier = Math.max(MIN_MODIFIER, presetEditorModifier - 1);
  presetModifierInput.value = formatModifierInput(presetEditorModifier);
  renderPresetEditorControls();
});
presetModifierIncrease.addEventListener('click', () => {
  presetEditorModifier = Math.min(MAX_MODIFIER, presetEditorModifier + 1);
  presetModifierInput.value = formatModifierInput(presetEditorModifier);
  renderPresetEditorControls();
});
presetModifierInput.addEventListener('focus', () => presetModifierInput.select());
presetModifierInput.addEventListener('blur', commitPresetModifierInput);
presetModifierInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    hideTooltip();
    const direction = event.key === 'ArrowUp' ? 1 : -1;
    presetEditorModifier = Math.min(MAX_MODIFIER, Math.max(MIN_MODIFIER, presetEditorModifier + direction));
    presetModifierInput.value = formatModifierInput(presetEditorModifier);
    renderPresetEditorControls();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    presetModifierInput.blur();
  } else if (event.key === 'Escape') {
    hideTooltip();
    presetModifierInput.value = formatModifierInput(presetEditorModifier);
    presetModifierInput.blur();
  }
});
presetDifficultyEnabled.addEventListener('change', renderPresetEditorControls);
presetCriticalsEnabled.addEventListener('change', renderPresetEditorControls);
presetDifficultyDecrease.addEventListener('click', () => {
  presetEditorDifficulty = Math.max(MIN_DIFFICULTY, presetEditorDifficulty - 1);
  presetDifficultyInput.value = String(presetEditorDifficulty);
  renderPresetEditorControls();
});
presetDifficultyIncrease.addEventListener('click', () => {
  presetEditorDifficulty = Math.min(MAX_DIFFICULTY, presetEditorDifficulty + 1);
  presetDifficultyInput.value = String(presetEditorDifficulty);
  renderPresetEditorControls();
});
presetDifficultyInput.addEventListener('focus', () => presetDifficultyInput.select());
presetDifficultyInput.addEventListener('blur', commitPresetDifficultyInput);
presetDifficultyInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    hideTooltip();
    const direction = event.key === 'ArrowUp' ? 1 : -1;
    presetEditorDifficulty = Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, presetEditorDifficulty + direction));
    presetDifficultyInput.value = String(presetEditorDifficulty);
    renderPresetEditorControls();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    presetDifficultyInput.blur();
  } else if (event.key === 'Escape') {
    hideTooltip();
    presetDifficultyInput.value = String(presetEditorDifficulty);
    presetDifficultyInput.blur();
  }
});
presetUnsavedSave.addEventListener('click', () => {
  const action = pendingPresetAction;
  pendingPresetAction = null;
  presetUnsavedConfirmation.hidden = true;
  savePresetEditor({ afterSave: action });
});
presetUnsavedDiscard.addEventListener('click', () => {
  const action = pendingPresetAction;
  resetPresetEditorState();
  action?.();
});
presetUnsavedCancel.addEventListener('click', () => {
  pendingPresetAction = null;
  presetUnsavedConfirmation.hidden = true;
  presetName.focus();
});
settingsOpen.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeSettings();
});
settingsDialog.addEventListener('click', (event) => {
  if (event.target === settingsDialog) closeSettings();
});
settingsDialog.addEventListener('close', handleSettingsClosed);
languageOptions.forEach((option, index) => {
  option.addEventListener('click', () => setLanguage(option.dataset.language));
  option.addEventListener('keydown', (event) => handleRadioArrow(
    event,
    languageOptions,
    index,
    (nextIndex) => setLanguage(languageOptions[nextIndex].dataset.language, { focus: true }),
  ));
});
fpsOptions.forEach((option, index) => {
  option.addEventListener('click', () => setFps(option.dataset.fps));
  option.addEventListener('keydown', (event) => handleRadioArrow(
    event,
    fpsOptions,
    index,
    (nextIndex) => setFps(fpsOptions[nextIndex].dataset.fps, { focus: true }),
  ));
});
settingsSound.addEventListener('change', () => {
  appSettings = saveSettings(historyStorage, { ...appSettings, soundEnabled: settingsSound.checked });
  renderSettings();
});
settingsDieOptions.forEach((option, index) => {
  option.addEventListener('click', () => setSettingsDie(option.dataset.settingsDie));
  option.addEventListener('keydown', (event) => handleRadioArrow(
    event,
    settingsDieOptions,
    index,
    (nextIndex) => setSettingsDie(settingsDieOptions[nextIndex].dataset.settingsDie, { focus: true }),
  ));
});
Object.entries(settingsColorInputs).forEach(([part, input]) => {
  input.addEventListener('input', () => setPaletteColor(part, input.value));
  input.addEventListener('change', () => setPaletteColor(part, input.value, { immediate: true }));
});
settingsReset.addEventListener('click', () => {
  settingsReset.hidden = true;
  settingsResetConfirmation.hidden = false;
  settingsConfirmReset.focus();
});
settingsCancelReset.addEventListener('click', () => {
  resetSettingsConfirmation();
  settingsReset.focus();
});
settingsConfirmReset.addEventListener('click', applyResetSettings);
historyOpen.addEventListener('click', openHistory);
historyClose.addEventListener('click', closeHistory);
historyDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeHistory();
});
historyDialog.addEventListener('click', (event) => {
  if (event.target === historyDialog) closeHistory();
});
historyDialog.addEventListener('close', handleHistoryClosed);
historyClear.addEventListener('click', () => {
  historyClear.hidden = true;
  historyClearConfirmation.hidden = false;
  historyConfirmClear.focus();
});
historyCancelClear.addEventListener('click', () => {
  resetClearConfirmation();
  historyClear.focus();
});
historyConfirmClear.addEventListener('click', () => {
  rollHistory = clearHistory(campaignDataStorage);
  renderHistory();
  historyClose.focus();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && tooltipIsOpen()) {
    event.preventDefault();
    hideTooltip();
    return;
  }
  if (event.key === 'Escape' && (campaignsDialog.open || settingsDialog.open || historyDialog.open || presetsDialog.open)) {
    event.preventDefault();
    if (presetsDialog.open) requestClosePresets();
    else if (campaignsDialog.open) closeCampaigns();
    else if (settingsDialog.open) closeSettings();
    else closeHistory();
    return;
  }
  if (event.code === 'Space' && event.target === document.body && !campaignsDialog.open && !historyDialog.open && !settingsDialog.open && !presetsDialog.open) {
    event.preventDefault();
    rollDie();
  }
});
window.addEventListener('beforeunload', () => {
  hideTooltip();
  paletteUpdateTimeouts.forEach((timeout) => window.clearTimeout(timeout));
  diceScene?.dispose();
}, { once: true });

applyStaticTranslations();
renderCampaignContext();
renderCampaignDialog();
renderSettings();
updateSelectedDieUi({ clearResult: false });
showOutcome({ value: 12 });
renderHistory();
renderArenaStatus();
initializeScene();
