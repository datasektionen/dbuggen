import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const markup = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const translations = readFileSync(new URL('../src/i18n.js', import.meta.url), 'utf8');
const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
const controlPanel = markup.slice(
  markup.indexOf('<aside class="control-panel"'),
  markup.indexOf('</aside>', markup.indexOf('<aside class="control-panel"')),
);
const campaignDialogMarkup = markup.slice(
  markup.indexOf('<dialog class="campaigns-dialog"'),
  markup.indexOf('</dialog>', markup.indexOf('<dialog class="campaigns-dialog"')),
);
const campaignListRenderer = mainSource.slice(
  mainSource.indexOf('function createCampaignListItem'),
  mainSource.indexOf('function renderCampaignList'),
);

function assertAppearsInOrder(source, fragments) {
  let previousIndex = -1;
  fragments.forEach((fragment) => {
    const index = source.indexOf(fragment);
    assert.notEqual(index, -1, `Expected markup to contain ${fragment}`);
    assert.ok(index > previousIndex, `Expected ${fragment} to appear after the preceding control`);
    previousIndex = index;
  });
}

test('the frame-rate selector exposes every supported FPS option in order', () => {
  assertAppearsInOrder(markup, [
    'data-fps="auto"',
    'data-fps="30"',
    'data-fps="60"',
    'data-fps="120"',
  ]);
});

test('campaigns use the third header action and expose a complete accessible inline manager', () => {
  const topActions = markup.slice(
    markup.indexOf('<div class="top-actions">'),
    markup.indexOf('</div>', markup.indexOf('<div class="top-actions">')),
  );
  assertAppearsInOrder(topActions, ['id="campaigns-open"', 'id="settings-open"', 'id="history-open"']);
  assert.match(markup, /id="campaigns-open"[^>]*aria-controls="campaigns-dialog"[^>]*aria-expanded="false"/);
  assert.match(markup, /id="campaigns-new"[^>]*aria-label="Ny kampanj"[^>]*data-i18n-aria-label="campaigns\.new"[^>]*data-i18n-tooltip="campaigns\.new"/);
  assert.match(markup, /id="campaigns-dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="campaigns-title"[^>]*aria-describedby="campaigns-summary"/);
  assert.match(markup, /id="campaign-create"[^>]*novalidate hidden/);
  assert.match(markup, /id="campaign-manage"[^>]*novalidate hidden/);
  assert.match(markup, /id="campaign-delete-confirmation"[^>]*role="alertdialog"/);
  assert.match(markup, /id="campaign-status" aria-live="polite"/);
});

test('campaign controls use one aligned icon system without a selected-state dot or Unicode actions', () => {
  assert.doesNotMatch(markup, /campaigns-button-state/);
  assert.doesNotMatch(styles, /campaigns-button-state|campaigns-button\[data-selected="true"\]/);
  assert.doesNotMatch(mainSource, /campaignsOpen\.dataset\.selected/);
  assert.match(markup, /id="campaigns-open"[\s\S]*?<svg class="campaigns-button-icon" viewBox="0 0 24 24"/);
  assert.equal((campaignDialogMarkup.match(/class="campaign-control-icon"/g) ?? []).length, 3);
  assert.equal((campaignDialogMarkup.match(/data-i18n-tooltip="campaigns\.(?:back|new|close)"/g) ?? []).length, 3);
  assert.doesNotMatch(campaignDialogMarkup, /[‹＋×]/);
  assert.match(campaignListRenderer, /createCampaignIcon\(campaign \? 'campaign' : 'standalone'\)/);
  assert.match(campaignListRenderer, /createCampaignIcon\('selected'\)/);
  assert.match(campaignListRenderer, /createCampaignIcon\('manage'\)/);
  assert.match(campaignListRenderer, /manageButton\.dataset\.tooltip = manageLabel/);
  assert.doesNotMatch(campaignListRenderer, /[⚑✦✓⋯]/);
  assert.match(styles, /\.campaigns-close,\s*\.campaigns-back\s*\{[^}]*flex:\s*0 0 40px;[^}]*width:\s*40px;[^}]*height:\s*40px/s);
  assert.match(styles, /\.campaign-list-item\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 48px;[^}]*min-height:\s*68px/s);
  assert.match(styles, /\.campaign-manage-button\s*\{[^}]*width:\s*40px;[^}]*height:\s*40px;[^}]*border-radius:\s*50%/s);
  assert.match(styles, /\.campaign-danger-zone\s*\{[^}]*border-top:\s*1px solid rgba\(207, 83, 55, \.22\)/s);
});

test('campaign header actions stay right-aligned and campaign names are searchable', () => {
  assert.match(campaignDialogMarkup, /class="campaigns-header-leading"[\s\S]*?id="campaigns-back"[\s\S]*?class="campaigns-header-copy"/);
  assert.match(styles, /\.campaigns-header\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/s);
  assert.match(styles, /\.campaigns-header-leading\s*\{[^}]*display:\s*flex[^}]*min-width:\s*0/s);
  assert.match(styles, /\.campaigns-header-actions\s*\{[^}]*justify-self:\s*end;[^}]*gap:\s*16px/s);
  assert.match(campaignDialogMarkup, /id="campaigns-search-shell" hidden[\s\S]*?id="campaigns-search" type="search"[^>]*data-i18n-placeholder="campaigns\.searchPlaceholder"/);
  assert.match(campaignDialogMarkup, /id="campaigns-search-summary" aria-live="polite"/);
  assert.match(campaignDialogMarkup, /id="campaigns-no-results" hidden[\s\S]*?data-i18n="campaigns\.noResultsTitle"/);
  assert.match(mainSource, /searchCampaigns\(campaignState, campaignsSearch\.value\)/);
  assert.match(mainSource, /campaignsSearchShell\.hidden = !hasCampaigns/);
  assert.match(mainSource, /createCampaignListItem\(null\),\s*\.\.\.campaigns\.map\(createCampaignListItem\)/s);
  assert.match(mainSource, /campaignsSearch\.value = ''/);
  assert.match(mainSource, /campaignsSearch\.addEventListener\('input', renderCampaignList\)/);
});

test('campaign context and responsive header preserve concise status at mobile sizes', () => {
  assert.match(markup, /class="location" id="campaign-context" aria-live="polite"/);
  assert.match(mainSource, /t\('campaigns\.contextActive', \{ name: campaign\.name \}\)/);
  assert.match(mainSource, /campaignsOpen\.disabled = active/);
  assert.match(styles, /@media \(max-width: 430px\)[\s\S]*?\.top-bar\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/s);
  assert.match(styles, /@media \(max-width: 430px\)[\s\S]*?\.crest\s*\{\s*display:\s*none/s);
  assert.match(styles, /\.campaigns-button,\s*\.settings-button,\s*\.history-button\s*\{\s*width:\s*44px;\s*height:\s*44px/s);
});

test('history and preset persistence are rebound through the active campaign scope', () => {
  assert.match(mainSource, /campaignDataStorage = createCampaignStorage\(historyStorage, campaignState\.selectedCampaignId\)/);
  assert.match(mainSource, /addHistoryEntry\(campaignDataStorage, rollHistory/);
  assert.match(mainSource, /savePresets\(campaignDataStorage,/);
  assert.match(mainSource, /clearHistory\(campaignDataStorage\)/);
  assert.match(mainSource, /saveSettings\(historyStorage,/);
  assert.match(mainSource, /commitCampaignlessTransfer\(/);
});

test('main and preset D20 controls share the requested vertical order', () => {
  assertAppearsInOrder(controlPanel, [
    'id="modifier-value"',
    'id="critical-toggle"',
    'id="difficulty-toggle"',
    'id="difficulty-value"',
  ]);
  assertAppearsInOrder(markup, [
    'id="preset-modifier"',
    'id="preset-criticals-enabled"',
    'id="preset-difficulty-enabled"',
    'id="preset-difficulty"',
  ]);
  assert.equal((markup.match(/inputmode="text"/g) ?? []).length, 4);
});

test('roll actions lead the simplified and accessibly labelled control panel', () => {
  assert.match(controlPanel, /^<aside class="control-panel" aria-label="Välj tärning" data-i18n-aria-label="dice.choose">\s*<div class="roll-actions"/);
  assertAppearsInOrder(controlPanel, [
    'id="roll-actions"',
    'id="roll-again"',
    'id="roll-reset"',
    'class="dice-picker"',
  ]);
  assert.match(controlPanel, /id="roll-reset"[^>]* hidden>/);
  assert.match(markup, /<main class="scene" id="app-scene" aria-labelledby="arena-title">/);
  assert.doesNotMatch(markup, /check-card|check-eyebrow|scene-title|check-detail/);
  assert.doesNotMatch(markup, /dice-picker-title/);
  assert.doesNotMatch(mainSource, /checkEyebrow|sceneTitle|checkDetail/);
});

test('the redundant dice-count field and its unused copy are fully removed', () => {
  assert.doesNotMatch(markup, /dice-count-copy|picker-heading/);
  assert.doesNotMatch(mainSource, /diceCountCopy/);
  assert.doesNotMatch(styles, /picker-heading/);
  assert.doesNotMatch(translations, /'dice\.(?:one|two)'/);
});

test('recent presets show only a correctly shaped icon and name while retaining accessible details', () => {
  const recentRenderer = mainSource.slice(
    mainSource.indexOf('function renderPresetShelf()'),
    mainSource.indexOf('function setPresetView'),
  );
  assert.match(recentRenderer, /button\.dataset\.tooltip = summaryCopy/);
  assert.match(recentRenderer, /button\.setAttribute\('aria-label', quickApplyDescription\)/);
  assert.match(recentRenderer, /createDieIcon\('recent-preset-die', preset\.dieType\)/);
  assert.doesNotMatch(recentRenderer, /createElement\('small'\)/);
});

test('preset, settings, and history icons all use the shared die-shape treatment', () => {
  diceTypes.forEach((type) => assert.match(styles, new RegExp(`\\.glyph-${type}\\s*\\{`)));
  assert.match(mainSource, /element\.classList\.add\('die-glyph', `glyph-\$\{type\}`\)/);
  assert.match(mainSource, /createDieIcon\('preset-library-die', preset\.dieType\)/);
  assert.match(mainSource, /applyDieIcon\(presetPreviewDie, preset\.dieType\)/);
  assert.match(mainSource, /applyDieIcon\(settingsDiePreview, settingsDieType/);
  assert.match(mainSource, /createDieIcon\('history-die-badge', entry\.dieType\)/);
  assert.match(markup, /class="preset-preview-die die-glyph glyph-d20"/);
  assert.match(markup, /class="settings-die-preview die-glyph glyph-d20"/);
});

test('the settings color preview alone renders the selected edge as a die-shaped outline', () => {
  assert.match(styles, /\.settings-die-preview\s*\{[^}]*isolation:\s*isolate;[^}]*border:\s*0;[^}]*background:\s*var\(--die-edge\)/s);
  assert.match(styles, /\.settings-die-preview::before\s*\{[^}]*inset:\s*3px;[^}]*clip-path:\s*inherit;[^}]*background:\s*var\(--die-gradient\)/s);
  assert.match(styles, /\.die-glyph\s*\{[^}]*background:\s*var\(--die-gradient/s);
  assert.doesNotMatch(styles, /\.die-glyph::before/);
});

test('the preset shelf is anchored to the scene column instead of the control panel', () => {
  const sceneColumn = markup.slice(
    markup.indexOf('<div class="scene-column">'),
    markup.indexOf('<aside class="control-panel"'),
  );
  assertAppearsInOrder(sceneColumn, ['class="arena-panel"', 'class="preset-shelf"']);
  assert.match(styles, /\.scene-column\s*\{[^}]*display:\s*grid[^}]*gap:\s*var\(--simulator-gap\)/s);
  assert.match(styles, /\.arena-panel\s*\{[^}]*min-height:\s*min\(880px, calc\(100svh - 112px\)\)/s);
  assert.doesNotMatch(styles, /grid-template-areas|grid-area:\s*(?:arena|presets|controls)/);
});

test('preset preview uses balanced roll and D20 groups without a redundant die cell', () => {
  const preview = markup.slice(
    markup.indexOf('<article class="preset-preview"'),
    markup.indexOf('</article>', markup.indexOf('<article class="preset-preview"')),
  );
  const rollSection = preview.slice(
    preview.indexOf('aria-labelledby="preset-preview-roll-title"'),
    preview.indexOf('</section>', preview.indexOf('aria-labelledby="preset-preview-roll-title"')),
  );
  const d20Section = preview.slice(
    preview.indexOf('id="preset-preview-d20-section"'),
    preview.indexOf('</section>', preview.indexOf('id="preset-preview-d20-section"')),
  );

  assertAppearsInOrder(rollSection, ['presets.rollSettings', 'preset-preview-mode', 'preset-preview-modifier']);
  assertAppearsInOrder(d20Section, ['presets.d20Rules', 'preset-preview-difficulty', 'preset-preview-criticals']);
  assert.equal((rollSection.match(/<div>/g) ?? []).length, 2);
  assert.equal((d20Section.match(/<div>/g) ?? []).length, 2);
  assert.doesNotMatch(preview, /preset-preview-die-value|preset-preview-note/);
});

test('non-D20 preset editing hides and disables every D20-only control', () => {
  assert.match(mainSource, /presetCriticalsRow\.hidden = !isD20/);
  assert.match(mainSource, /presetDifficultyRow\.hidden = !isD20/);
  assert.match(mainSource, /presetDifficultyValueRow\.hidden = !isD20/);
  assert.match(mainSource, /presetCriticalsEnabled\.disabled = !isD20/);
  assert.match(mainSource, /presetDifficultyEnabled\.disabled = !isD20/);
  assert.doesNotMatch(markup, /preset-non-d20-note|presets\.nonD20EditorNote/);
});

test('rule toggles use regular-weight labels and screen-reader-only descriptions', () => {
  assert.equal((markup.match(/data-i18n-tooltip="check\.(?:criticals|difficulty)Description"/g) ?? []).length, 4);
  assert.equal((markup.match(/class="sr-only" id="(?:critical-toggle|difficulty-toggle|preset-criticals|preset-difficulty)-description"/g) ?? []).length, 4);
  assert.match(markup, /id="preset-criticals-enabled"[^>]*aria-describedby="preset-criticals-description"/);
  assert.match(markup, /id="preset-difficulty-enabled"[^>]*aria-describedby="preset-difficulty-description"/);
  assert.match(styles, /\.rule-toggle-label\s*\{[^}]*font-weight:\s*400/s);
  assert.match(styles, /\.rule-toggle-state\s*\{[^}]*font-weight:\s*400/s);
  assert.match(styles, /\.preset-rule-toggle-label\s*\{[^}]*font-weight:\s*400/s);
  assert.match(styles, /\.preset-rule-toggle-state\s*\{[^}]*font-weight:\s*400/s);
});

test('the shared tooltip supports localized static descriptions and live expression previews', () => {
  assert.match(markup, /id="hover-tooltip" role="tooltip" popover="manual"/);
  assert.match(mainSource, /document\.querySelectorAll\('\[data-i18n-tooltip\]'\)/);
  assert.match(mainSource, /button\.dataset\.tooltip = summaryCopy/);
  assert.match(mainSource, /event\.pointerType === 'touch'/);
  assert.match(mainSource, /keyboardTooltipFocus = true/);
  assert.match(mainSource, /if \(!keyboardTooltipFocus \|\| !\(event\.target instanceof Element\)\) return/);
  assert.match(mainSource, /function showExpressionTooltip\(target, expression, resultCopy\)/);
  assert.match(mainSource, /hoverTooltip\.setAttribute\('aria-live', 'polite'\)/);
  assert.match(mainSource, /describedBy\.add\(hoverTooltip\.id\)/);
  assert.match(mainSource, /input\.addEventListener\('input', handleArithmeticInput\)/);
  assert.match(mainSource, /window\.addEventListener\('scroll', handleTooltipViewportChange, true\)/);
  assert.match(mainSource, /window\.addEventListener\('resize', handleTooltipViewportChange\)/);
  assert.match(styles, /\.hover-tooltip\s*\{[^}]*text-align:\s*left/s);
  assert.match(styles, /\.hover-tooltip\[data-mode="expression"\]\s*\{[^}]*text-align:\s*center/s);
  assert.match(styles, /\.expression-tooltip-result\s*\{[^}]*display:\s*block[^}]*margin-top:\s*8px/s);
  assert.match(mainSource, /event\.key === 'Escape' && tooltipIsOpen\(\)/);
});

test('rule toggles match nearby controls and successful outcomes use green consistently', () => {
  assert.match(styles, /\.rule-toggle\s*\{[^}]*min-height:\s*42px[^}]*border:\s*1px solid rgba\(221, 172, 94, \.22\)[^}]*background:\s*rgba\(255, 255, 255, \.018\)/s);
  assert.doesNotMatch(styles, /\.rule-toggle\[data-enabled="true"\]\s*\{[^}]*background/);
  assert.match(styles, /--bright-success:\s*#b7edc2/);
  assert.match(styles, /\.outcome-panel\.success \.total span\s*\{\s*color:\s*var\(--bright-success\)/);
  assert.match(styles, /\.history-entry\[data-outcome="success"\]\s*\{[^}]*var\(--success\)/);
  assert.match(styles, /\.history-entry\[data-outcome="success"\] \.history-entry-outcome\s*\{\s*color:\s*var\(--bright-success\)/);
});
