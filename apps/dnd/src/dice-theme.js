function makeTheme(theme) {
  return Object.freeze({
    ...theme,
    gradient: Object.freeze(theme.gradient.map((stop) => Object.freeze({ ...stop }))),
  });
}

export const DICE_THEMES = Object.freeze({
  d4: makeTheme({
    gradient: [
      { offset: 0, color: '#FF9A3C' },
      { offset: 0.52, color: '#DF4D21' },
      { offset: 1, color: '#781F19' },
    ],
    accent: '#DF4D21',
    accentRgb: '223 77 33',
    edge: '#4C1712',
    numberFill: '#FFF0DC',
    numberStroke: '#4A120C',
    iconInk: '#34120B',
    roughness: 0.38,
    metalness: 0.12,
  }),
  d6: makeTheme({
    gradient: [
      { offset: 0, color: '#FFE76A' },
      { offset: 0.5, color: '#D3AD25' },
      { offset: 1, color: '#73540D' },
    ],
    accent: '#D3AD25',
    accentRgb: '211 173 37',
    edge: '#4C3508',
    numberFill: '#FFF8D6',
    numberStroke: '#493407',
    iconInk: '#2E2208',
    roughness: 0.4,
    metalness: 0.08,
  }),
  d8: makeTheme({
    gradient: [
      { offset: 0, color: '#2AA9AD' },
      { offset: 0.5, color: '#08717C' },
      { offset: 1, color: '#073A49' },
    ],
    accent: '#168C95',
    accentRgb: '22 140 149',
    edge: '#052932',
    numberFill: '#E8FFFF',
    numberStroke: '#06272E',
    iconInk: '#E8FFFF',
    roughness: 0.38,
    metalness: 0.12,
  }),
  d10: makeTheme({
    gradient: [
      { offset: 0, color: '#70A948' },
      { offset: 0.5, color: '#39733B' },
      { offset: 1, color: '#173E2C' },
    ],
    accent: '#4D883F',
    accentRgb: '77 136 63',
    edge: '#102B1F',
    numberFill: '#F1F8DE',
    numberStroke: '#152A16',
    iconInk: '#F1F8DE',
    roughness: 0.4,
    metalness: 0.08,
  }),
  d12: makeTheme({
    gradient: [
      { offset: 0, color: '#AC79D1' },
      { offset: 0.5, color: '#704897' },
      { offset: 1, color: '#35254F' },
    ],
    accent: '#8659AA',
    accentRgb: '134 89 170',
    edge: '#241934',
    numberFill: '#F5E9FF',
    numberStroke: '#281536',
    iconInk: '#F5E9FF',
    roughness: 0.38,
    metalness: 0.12,
  }),
  d20: makeTheme({
    gradient: [
      { offset: 0, color: '#D8DDE0' },
      { offset: 0.38, color: '#768087' },
      { offset: 0.56, color: '#BFC6CA' },
      { offset: 1, color: '#3A4349' },
    ],
    accent: '#929CA2',
    accentRgb: '146 156 162',
    edge: '#20272C',
    numberFill: '#F5F0DF',
    numberStroke: '#20252A',
    iconInk: '#1A2024',
    roughness: 0.26,
    metalness: 0.72,
  }),
});

export const DEFAULT_DICE_PALETTES = Object.freeze(Object.fromEntries(
  Object.entries(DICE_THEMES).map(([type, theme]) => [type, Object.freeze({
    face: theme.accent,
    edge: theme.edge,
    number: theme.numberFill,
  })]),
));

const HEX_COLOR = /^#[0-9A-F]{6}$/i;

function normalizeHex(color) {
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) return null;
  return color.toUpperCase();
}

function hexToRgb(color) {
  const hex = normalizeHex(color);
  if (!hex) throw new TypeError(`Invalid color: ${color}`);
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

function mixColors(color, target, amount) {
  const sourceRgb = hexToRgb(color);
  const targetRgb = hexToRgb(target);
  return rgbToHex({
    r: sourceRgb.r + (targetRgb.r - sourceRgb.r) * amount,
    g: sourceRgb.g + (targetRgb.g - sourceRgb.g) * amount,
    b: sourceRgb.b + (targetRgb.b - sourceRgb.b) * amount,
  });
}

function relativeLuminance(color) {
  const { r, g, b } = hexToRgb(color);
  const channels = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function createGradient(type, face) {
  if (type === 'd20') {
    return [
      { offset: 0, color: mixColors(face, '#FFFFFF', 0.46) },
      { offset: 0.38, color: mixColors(face, '#000000', 0.22) },
      { offset: 0.56, color: mixColors(face, '#FFFFFF', 0.28) },
      { offset: 1, color: mixColors(face, '#000000', 0.58) },
    ];
  }
  const middleOffset = DICE_THEMES[type].gradient[1].offset;
  return [
    { offset: 0, color: mixColors(face, '#FFFFFF', 0.3) },
    { offset: middleOffset, color: face },
    { offset: 1, color: mixColors(face, '#000000', 0.58) },
  ];
}

export function isHexColor(color) {
  return normalizeHex(color) !== null;
}

export function createDiceTheme(type, palette = DEFAULT_DICE_PALETTES[type]) {
  const base = getDiceTheme(type);
  const defaults = DEFAULT_DICE_PALETTES[type];
  const face = normalizeHex(palette?.face) ?? defaults.face;
  const edge = normalizeHex(palette?.edge) ?? defaults.edge;
  const number = normalizeHex(palette?.number) ?? defaults.number;
  const usesDefaultFace = face === defaults.face;
  const usesDefaultNumber = number === defaults.number;
  const { r, g, b } = hexToRgb(face);

  return makeTheme({
    ...base,
    gradient: usesDefaultFace ? base.gradient : createGradient(type, face),
    accent: usesDefaultFace ? base.accent : face,
    accentRgb: usesDefaultFace ? base.accentRgb : `${r} ${g} ${b}`,
    edge,
    numberFill: number,
    numberStroke: usesDefaultFace && usesDefaultNumber
      ? base.numberStroke
      : relativeLuminance(number) > 0.42 ? '#15100D' : '#F8F2E2',
    iconInk: usesDefaultNumber ? base.iconInk : number,
  });
}

export function getDiceThemeStyles(theme) {
  const gradient = theme.gradient
    .map(({ offset, color }) => `${color} ${Math.round(offset * 100)}%`)
    .join(', ');
  return Object.freeze({
    '--die-gradient': `linear-gradient(145deg, ${gradient})`,
    '--die-accent': theme.accent,
    '--die-accent-rgb': theme.accentRgb,
    '--die-edge': theme.edge,
    '--die-number': theme.numberFill,
    '--die-number-stroke': theme.numberStroke,
    '--die-ink': theme.iconInk,
  });
}

export function getDiceTheme(type) {
  const theme = DICE_THEMES[type];
  if (!theme) throw new RangeError(`Unsupported die type: ${type}`);
  return theme;
}
