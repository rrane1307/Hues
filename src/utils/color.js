/**
 * HUES — Chromatic Field Science Utilities
 * High-precision colour extraction, pigment classification, and archival numbering.
 */

/**
 * Convert RGB values (0-255) to uppercase 6-character hex code
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Convert Hex code to { r, g, b }
 */
export function hexToRgb(hex) {
  let cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Convert RGB (0-255) to HSL ({ h: 0-360, s: 0-100, l: 0-100 })
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Calculate standard relative luminance according to WCAG 2.1
 * Returns 0 (darkest black) to 1 (brightest white)
 */
export function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Best contrast foreground colour (ink dark vs parchment light)
 */
export function getContrastColor(r, g, b) {
  const lum = getRelativeLuminance(r, g, b);
  return lum > 0.42 ? '#1c1917' : '#faf7f2';
}

/**
 * Naturalist Pigment Descriptor
 * Generates an archival botanical/mineral taxonomy name based on chromatic coords.
 */
export function getNaturalPigmentName(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);

  // Achromatic / Earth neutrality
  if (s < 12) {
    if (l > 88) return 'Chalk Limestone';
    if (l > 72) return 'River Silt';
    if (l > 55) return 'Weathered Flint';
    if (l > 38) return 'Basalt Slate';
    if (l > 20) return 'Wet Charcoal';
    return 'Obsidian Mineral';
  }

  // Warm Earths & Browns (low saturation oranges/reds)
  if (h >= 15 && h <= 45 && s < 45) {
    if (l > 70) return 'Raw Sandstone';
    if (l > 50) return 'Weathered Ochre';
    if (l > 30) return 'Raw Sienna';
    return 'Burnt Umber';
  }

  // Hue classification
  if (h >= 345 || h < 15) {
    // Reds
    if (l > 75) return 'Wild Dogwood';
    if (l > 50) return s > 60 ? 'Cochineal Crimson' : 'Faded Brick';
    return 'Madder Root';
  } else if (h >= 15 && h < 45) {
    // Orange / Terracotta
    if (l > 75) return 'Apricot Lichen';
    if (l > 50) return s > 60 ? 'Fired Terracotta' : 'Spiced Clay';
    return 'Roasted Chestnut';
  } else if (h >= 45 && h < 70) {
    // Yellows
    if (l > 75) return 'Pale Primrose';
    if (l > 50) return s > 60 ? 'Gilded Pollen' : 'Dry Hay';
    return 'Dark Ochre Earth';
  } else if (h >= 70 && h < 160) {
    // Greens
    if (l > 75) return 'Young Willow Shoot';
    if (l > 50) return s > 50 ? 'Lichen Green' : 'Weathered Moss';
    return s > 50 ? 'Deep Pine Canopy' : 'Smoked Peat';
  } else if (h >= 160 && h < 200) {
    // Cyans / Teals
    if (l > 75) return 'Glacial Pool';
    if (l > 50) return 'Verdigris Patina';
    return 'Deep Mineral Tarn';
  } else if (h >= 200 && h < 260) {
    // Blues
    if (l > 75) return 'Morning Mist';
    if (l > 50) return s > 50 ? 'Wild Chicory' : 'Faded Slate';
    return 'Midnight Lapis';
  } else if (h >= 260 && h < 315) {
    // Violets / Purples
    if (l > 75) return 'Heather Blossom';
    if (l > 50) return 'Mountain Bellflower';
    return 'Dusk Amethyst';
  } else {
    // Magentas / Pinks
    if (l > 75) return 'Dry Thistle';
    if (l > 50) return 'Cranberry Peat';
    return 'Bog Orchid';
  }
}

/**
 * Generate a unique specimen reference number
 * Example: "HUE-2026-7842"
 */
export function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `HUE-${year}-${randomSuffix}`;
}

/**
 * Generate stable UUID
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'specimen_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4))
  };
}

/**
 * Generate 3 harmonious palette companion shades for retro game swatch card
 */
export function getHarmoniousCompanions(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);
  
  // Companion 1: Soft Pastel Tint
  const h1 = (h + 35) % 360;
  const rgb1 = hslToRgb(h1, Math.max(25, s * 0.5), Math.min(84, Math.max(68, l + 20)));
  const hex1 = rgbToHex(rgb1.r, rgb1.g, rgb1.b);
  const name1 = getNaturalPigmentName(rgb1.r, rgb1.g, rgb1.b);

  // Companion 2: Vibrant Accent / Opposite Sky
  const h2 = (h + 180) % 360;
  const rgb2 = hslToRgb(h2, Math.min(90, Math.max(55, s)), Math.min(65, Math.max(45, l)));
  const hex2 = rgbToHex(rgb2.r, rgb2.g, rgb2.b);
  const name2 = getNaturalPigmentName(rgb2.r, rgb2.g, rgb2.b);

  // Companion 3: Deep Dusk / Velvet Tone
  const h3 = (h + 270) % 360;
  const rgb3 = hslToRgb(h3, Math.max(40, s * 0.8), Math.min(32, Math.max(16, l * 0.45)));
  const hex3 = rgbToHex(rgb3.r, rgb3.g, rgb3.b);
  const name3 = getNaturalPigmentName(rgb3.r, rgb3.g, rgb3.b);

  return [
    { name: name1, hex: hex1, ratio: '48% MATCH' },
    { name: name2, hex: hex2, ratio: '35% ACCENT' },
    { name: name3, hex: hex3, ratio: '25% SHADOW' }
  ];
}

/**
 * Fun game-like rarity badge and vibe
 */
export function getColorVibeAndRarity(r, g, b) {
  const { s, l } = rgbToHsl(r, g, b);
  let rarity = 'SPECIAL ★★☆';
  let vibe = 'EARTH TONE';

  if (s > 75) {
    rarity = 'EPIC ★★★';
    vibe = 'VIBRANT PUNCH';
  } else if (l < 25) {
    rarity = 'MYTHIC ★★★';
    vibe = 'DEEP VELVET';
  } else if (l > 75) {
    rarity = 'RARE ★★☆';
    vibe = 'SOFT PASTEL';
  } else if (s < 20) {
    rarity = 'CLASSIC ★☆☆';
    vibe = 'NATURAL SILT';
  } else {
    rarity = 'RARE ★★☆';
    vibe = 'COOL SPECTRUM';
  }

  return { rarity, vibe };
}

/**
 * Format ISO date string into friendly everyday date
 * e.g., "Oct 11, 2026 · 16:42"
 */
export function formatArchivalDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const options = { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  };
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  return `${date.toLocaleDateString('en-US', options)} · ${date.toLocaleTimeString([], timeOptions)}`;
}
