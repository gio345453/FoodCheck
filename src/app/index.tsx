import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { StatusBar } from 'expo-status-bar';

type AllergenId =
  | 'gluten'
  | 'celiac'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soy'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

type LanguageCode =
  | 'it'
  | 'en'
  | 'fr'
  | 'de'
  | 'es'
  | 'pt'
  | 'nl'
  | 'pl'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ko';

type Nutriments = Record<string, number | string | undefined>;

interface Product extends Record<string, any> {
  code?: string;
  product_name?: string;
  product_name_it?: string;
  product_name_en?: string;
  brands?: string;

  image_front_url?: string;

  nutriscore_grade?: string;

  lang?: string;
  lc?: string;
  ingredients_lc?: string;

  languages_codes?: Record<string, number>;
  languages?: Record<string, number>;

  ingredients_text?: string;
  ingredients_text_it?: string;
  ingredients_text_en?: string;

  ingredients_text_with_allergens?: string;
  ingredients_text_with_allergens_it?: string;
  ingredients_text_with_allergens_en?: string;

  allergens?: string;
  allergens_from_ingredients?: string;
  allergens_tags?: string[];
  allergens_hierarchy?: string[];

  traces?: string;
  traces_tags?: string[];

  nutriments?: Nutriments;
}

interface ProductResponse {
  status: number;
  product?: Product;
  status_verbose?: string;
}

const ALLERGENS: {
  id: AllergenId;
  label: string;
  tags: string[];
  keywords: string[];
}[] = [
  {
    id: 'gluten',
    label: 'Cereali con glutine',
    tags: [
      'gluten',
      'wheat',
      'rye',
      'barley',
      'oats',
      'spelt',
      'kamut',
    ],
    keywords: [
      'glutine',
      'frumento',
      'grano',
      'farina di frumento',
      'wheat',
      'rye',
      'barley',
      'oats',
      'blé',
      'orge',
      'seigle',
      'weizen',
    ],
  },
  {
    id: 'celiac',
    label: 'Celiachia',
    tags: [
      'gluten',
      'wheat',
      'rye',
      'barley',
      'oats',
      'spelt',
      'kamut',
    ],
    keywords: [
      'glutine',
      'frumento',
      'grano',
      'farina di frumento',
      'wheat',
      'rye',
      'barley',
      'oats',
      'blé',
      'orge',
      'seigle',
      'weizen',
      'gluten',
    ],
  },
  {
    id: 'crustaceans',
    label: 'Crostacei',
    tags: ['crustaceans', 'crustacean'],
    keywords: [
      'crostacei',
      'gambero',
      'gamberi',
      'shrimp',
      'prawn',
      'crustacean',
      'crustacés',
    ],
  },
  {
    id: 'eggs',
    label: 'Uova',
    tags: ['eggs', 'egg'],
    keywords: [
      'uova',
      'uovo',
      'egg',
      'eggs',
      'oeuf',
      'œuf',
      'ei',
    ],
  },
  {
    id: 'fish',
    label: 'Pesce',
    tags: ['fish'],
    keywords: [
      'pesce',
      'fish',
      'poisson',
      'fisch',
    ],
  },
  {
    id: 'peanuts',
    label: 'Arachidi',
    tags: ['peanuts', 'peanut'],
    keywords: [
      'arachidi',
      'arachide',
      'peanut',
      'peanuts',
      'cacahuète',
      'erdnuss',
    ],
  },
  {
    id: 'soy',
    label: 'Soia',
    tags: ['soybeans', 'soy', 'soya'],
    keywords: [
      'soia',
      'soja',
      'soy',
      'soya',
      'sojabohne',
    ],
  },
  {
    id: 'milk',
    label: 'Latte',
    tags: ['milk', 'lactose'],
    keywords: [
      'latte',
      'lattosio',
      'milk',
      'lactose',
      'lait',
      'milch',
      'leche',
      'leite',
    ],
  },
  {
    id: 'nuts',
    label: 'Frutta a guscio',
    tags: [
      'nuts',
      'almond',
      'hazelnut',
      'walnut',
      'cashew',
      'pistachio',
      'pecan',
      'macadamia',
    ],
    keywords: [
      'frutta a guscio',
      'mandorle',
      'mandorla',
      'nocciole',
      'nocciola',
      'noci',
      'noce',
      'anacardi',
      'pistacchi',
      'almond',
      'hazelnut',
      'walnut',
      'cashew',
      'pistachio',
    ],
  },
  {
    id: 'celery',
    label: 'Sedano',
    tags: ['celery'],
    keywords: [
      'sedano',
      'celery',
      'céleri',
      'sellerie',
    ],
  },
  {
    id: 'mustard',
    label: 'Senape',
    tags: ['mustard'],
    keywords: [
      'senape',
      'mustard',
      'moutarde',
      'senf',
    ],
  },
  {
    id: 'sesame',
    label: 'Sesamo',
    tags: ['sesame-seeds', 'sesame'],
    keywords: [
      'sesamo',
      'sesame',
      'sésame',
    ],
  },
  {
    id: 'sulphites',
    label: 'Solfiti',
    tags: ['sulphites', 'sulfites'],
    keywords: [
      'solfiti',
      'sulfiti',
      'sulphites',
      'sulfites',
      'dioxide de soufre',
      'anidride solforosa',
    ],
  },
  {
    id: 'lupin',
    label: 'Lupini',
    tags: ['lupin', 'lupine'],
    keywords: [
      'lupini',
      'lupino',
      'lupin',
      'lupine',
    ],
  },
  {
    id: 'molluscs',
    label: 'Molluschi',
    tags: ['molluscs', 'molluscs'],
    keywords: [
      'molluschi',
      'mollusco',
      'mollusc',
      'mollusks',
      'mollusques',
    ],
  },
];

const LANGUAGE_NAMES: Record<string, string> = {
  it: 'Italiano',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

const LANGUAGE_PROFILES: Record<
  string,
  {
    words: string[];
    strongPhrases: string[];
  }
> = {
  it: {
    words: [
      'patate',
      'olio',
      'girasole',
      'farina',
      'frumento',
      'mais',
      'riso',
      'sale',
      'zucchero',
      'latte',
      'soia',
      'uova',
      'pesce',
      'senape',
      'sesamo',
      'mandorle',
      'noci',
      'può',
      'contenere',
      'consumarsi',
      'preferibilmente',
      'ingredienti',
      'ingredienti:',
      'con',
      'senza',
      'di',
      'delle',
      'degli',
      'degli',
      'proteine',
    ],
    strongPhrases: [
      'patate disidratate',
      'olio di girasole',
      'farina di frumento',
      'può contenere',
      'da consumarsi',
      'senza glutine',
      'con latte',
    ],
  },

  en: {
    words: [
      'potatoes',
      'oil',
      'sunflower',
      'flour',
      'wheat',
      'corn',
      'rice',
      'salt',
      'sugar',
      'milk',
      'soy',
      'eggs',
      'fish',
      'mustard',
      'sesame',
      'almonds',
      'walnuts',
      'ingredients',
      'may contain',
      'best before',
      'contains',
      'with',
    ],
    strongPhrases: [
      'dried potatoes',
      'sunflower oil',
      'wheat flour',
      'may contain',
      'best before',
      'ingredients',
    ],
  },

  fr: {
    words: [
      'pommes',
      'terre',
      'huile',
      'tournesol',
      'farine',
      'blé',
      'maïs',
      'riz',
      'sel',
      'sucre',
      'lait',
      'soja',
      'œuf',
      'poisson',
      'moutarde',
      'sésame',
      'amandes',
      'noix',
      'ingrédients',
      'peut contenir',
      'à consommer',
    ],
    strongPhrases: [
      'pommes de terre',
      'huile de tournesol',
      'farine de blé',
      'peut contenir',
      'à consommer',
      'ingrédients',
    ],
  },

  de: {
    words: [
      'kartoffeln',
      'öl',
      'sonnenblumenöl',
      'mehl',
      'weizen',
      'mais',
      'reis',
      'salz',
      'zucker',
      'milch',
      'soja',
      'eier',
      'fisch',
      'senf',
      'sesam',
      'mandeln',
      'nüsse',
      'zutaten',
      'kann enthalten',
    ],
    strongPhrases: [
      'getrocknete kartoffeln',
      'sonnenblumenöl',
      'weizenmehl',
      'kann enthalten',
      'zutaten',
    ],
  },

  es: {
    words: [
      'patatas',
      'aceite',
      'girasol',
      'harina',
      'trigo',
      'maíz',
      'arroz',
      'sal',
      'azúcar',
      'leche',
      'soja',
      'huevo',
      'pescado',
      'mostaza',
      'sésamo',
      'almendras',
      'nueces',
      'ingredientes',
      'puede contener',
      'consumir',
      'preferentemente',
    ],
    strongPhrases: [
      'patatas deshidratadas',
      'aceite de girasol',
      'harina de trigo',
      'puede contener',
      'consumir preferentemente',
    ],
  },

  pt: {
    words: [
      'batatas',
      'óleo',
      'girassol',
      'farinha',
      'trigo',
      'milho',
      'arroz',
      'sal',
      'açúcar',
      'leite',
      'soja',
      'ovo',
      'peixe',
      'mostarda',
      'sésamo',
      'amêndoas',
      'nozes',
      'ingredientes',
      'pode conter',
      'consumir',
    ],
    strongPhrases: [
      'batatas desidratadas',
      'óleo de girassol',
      'farinha de trigo',
      'pode conter',
      'ingredientes',
    ],
  },

  nl: {
    words: [
      'aardappelen',
      'olie',
      'zonnebloemolie',
      'bloem',
      'tarwe',
      'mais',
      'rijst',
      'zout',
      'suiker',
      'melk',
      'soja',
      'eieren',
      'vis',
      'mosterd',
      'sesam',
      'amandelen',
      'noten',
      'ingrediënten',
      'kan bevatten',
    ],
    strongPhrases: [
      'gedroogde aardappelen',
      'zonnebloemolie',
      'kan bevatten',
      'ingrediënten',
    ],
  },

  pl: {
    words: [
      'ziemniaki',
      'olej',
      'słonecznikowy',
      'mąka',
      'pszenna',
      'kukurydza',
      'ryż',
      'sól',
      'cukier',
      'mleko',
      'soja',
      'jaja',
      'ryba',
      'musztarda',
      'sezam',
      'migdały',
      'orzechy',
      'składniki',
      'może zawierać',
    ],
    strongPhrases: [
      'suszone ziemniaki',
      'olej słonecznikowy',
      'może zawierać',
      'składniki',
    ],
  },

  ru: {
    words: [
      'картофель',
      'масло',
      'подсолнечное',
      'мука',
      'пшеница',
      'кукуруза',
      'рис',
      'соль',
      'сахар',
      'молоко',
      'соя',
      'яйца',
      'рыба',
      'горчица',
      'кунжут',
      'миндаль',
      'орехи',
    ],
    strongPhrases: [
      'сушеный картофель',
      'подсолнечное масло',
    ],
  },

  zh: {
    words: [
      '马铃薯',
      '植物油',
      '葵花籽油',
      '面粉',
      '小麦',
      '玉米',
      '大米',
      '盐',
      '糖',
      '牛奶',
      '大豆',
      '鸡蛋',
      '鱼',
      '芥末',
      '芝麻',
      '杏仁',
      '坚果',
    ],
    strongPhrases: [],
  },

  ja: {
    words: [
      'じゃがいも',
      '油',
      'ひまわり油',
      '小麦粉',
      '小麦',
      'とうもろこし',
      '米',
      '塩',
      '砂糖',
      '牛乳',
      '大豆',
      '卵',
      '魚',
      'マスタード',
      'ごま',
      'アーモンド',
      'ナッツ',
    ],
    strongPhrases: [],
  },

  ko: {
    words: [
      '감자',
      '식용유',
      '해바라기유',
      '밀가루',
      '밀',
      '옥수수',
      '쌀',
      '소금',
      '설탕',
      '우유',
      '대두',
      '계란',
      '생선',
      '겨자',
      '참깨',
      '아몬드',
      '견과류',
    ],
    strongPhrases: [],
  },
};

const LANGUAGE_ORDER = [
  'it',
  'en',
  'fr',
  'de',
  'es',
  'pt',
  'nl',
  'pl',
  'ru',
  'zh',
  'ja',
  'ko',
];

const stripHtml = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return decodeHtmlEntities(stripHtml(value))
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ ]+([,;:.])/g, '$1')
    .replace(/([,;:.])[ ]+/g, '$1 ')
    .trim();
}

function removeNutritionSection(value: string): string {
  let text = normalizeText(value);

  if (!text) {
    return '';
  }

  const nutritionPatterns = [
    /\b\d{3,5}\s*kJ\b/i,
    /\b\d{2,4}\s*kcal\b/i,
    /\b\d{1,3}(?:[.,]\d+)?\s*g\s*(?:\/|per)\s*100\s*g\b/i,
    /\bper\s*100\s*g\b/i,
    /\bper\s*100g\b/i,
    /\b100\s*g\s*\|\s*RI\b/i,
    /\bRI["']?\s*\/\s*30g\b/i,
    /\b(reference intake|valeur énergétique|valeurs nutritionnelles|informação nutricional|informacion nutricional)\b/i,
  ];

  let cutAt = text.length;

  for (const pattern of nutritionPatterns) {
    const match = pattern.exec(text);

    if (match && match.index < cutAt) {
      cutAt = match.index;
    }
  }

  text = text.slice(0, cutAt).trim();

  return text;
}

function removeLanguageLabel(text: string): string {
  return text
    .replace(
      /^(?:ingredients?|ingredienti|ingrédients?|zutaten|ingredientes|sastāvdaļas|składniki)\s*[:\-]\s*/i,
      '',
    )
    .trim();
}

function languageScore(text: string, language: string): number {
  const profile = LANGUAGE_PROFILES[language];

  if (!profile) {
    return 0;
  }

  const normalized = normalizeText(text).toLowerCase();

  if (!normalized) {
    return 0;
  }

  let score = 0;

  for (const phrase of profile.strongPhrases) {
    const escaped = phrase
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const matches = normalized.match(new RegExp(escaped, 'g'));

    if (matches) {
      score += matches.length * 5;
    }
  }

  for (const word of profile.words) {
    const escaped = word
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const matches = normalized.match(
      new RegExp(`(?:^|\\s|[,;:()])${escaped}(?=\\s|[,;:.()!?]|$)`, 'gi'),
    );

    if (matches) {
      score += matches.length;
    }
  }

  return score;
}

function getLanguageMarkers(text: string) {
  const matches: {
    code: string;
    index: number;
  }[] = [];

  const regex =
    /(?:^|[\s|])\(?\s*(IT|EN|FR|DE|ES|PT|NL|PL|RU|ZH|JA|KO)\s*\)?(?=\s|:|-|$)/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      code: match[1].toLowerCase(),
      index: match.index,
    });
  }

  return matches;
}

function extractExplicitLanguageBlock(
  text: string,
  language: string,
): string {
  const normalized = removeNutritionSection(normalizeText(text));

  if (!normalized) {
    return '';
  }

  const markers = getLanguageMarkers(normalized);

  const exact = markers.find((marker) => marker.code === language);

  if (!exact) {
    return '';
  }

  const nextMarker = markers.find(
    (marker) => marker.index > exact.index,
  );

  const start = exact.index;
  const end = nextMarker ? nextMarker.index : normalized.length;

  let block = normalized.slice(start, end);

  block = block.replace(
    /^\s*(?:\(|\[)?(?:IT|EN|FR|DE|ES|PT|NL|PL|RU|ZH|JA|KO)(?:\)|\])?\s*/i,
    '',
  );

  return removeLanguageLabel(block).trim();
}

function extractBestLanguageChunk(
  text: string,
  language: string,
): string {
  const normalized = removeNutritionSection(normalizeText(text));

  if (!normalized) {
    return '';
  }

  /*
   * 1. Se esiste un blocco esplicito (IT), (EN), ecc.,
   *    usiamo direttamente quello.
   */
  const explicit = extractExplicitLanguageBlock(normalized, language);

  if (explicit) {
    const score = languageScore(explicit, language);

    if (score >= 2) {
      return removeLanguageLabel(explicit);
    }
  }

  /*
   * 2. Se il campo sembra già appartenere chiaramente
   *    alla lingua richiesta, teniamolo intero.
   */
  const wholeScore = languageScore(normalized, language);

  const knownOtherLanguages = LANGUAGE_ORDER.filter(
    (code) => code !== language && LANGUAGE_PROFILES[code],
  );

  let otherScore = 0;

  for (const other of knownOtherLanguages) {
    otherScore += languageScore(normalized, other);
  }

  const hasExplicitMarkers = getLanguageMarkers(normalized).length > 0;

  if (
    wholeScore >= 4 &&
    (!hasExplicitMarkers || wholeScore > otherScore * 0.75)
  ) {
    return removeLanguageLabel(normalized);
  }

  /*
   * 3. Campo OCR multilingue:
   *    creiamo blocchi ottenuti dalla punteggiatura.
   */
  const pieces = normalized
    .replace(/\n+/g, '. ')
    .split(/[.!?;]+/)
    .map((part) => removeLanguageLabel(part.trim()))
    .filter((part) => part.length >= 3);

  if (!pieces.length) {
    return '';
  }

  let best = '';
  let bestScore = 0;

  /*
   * Consideriamo finestre di 1-4 pezzi consecutivi.
   * In questo modo possiamo ricostruire, per esempio:
   * "Patate disidratate... Puo contenere latte... Da consumarsi..."
   */
  for (let size = 1; size <= Math.min(4, pieces.length); size += 1) {
    for (let i = 0; i + size <= pieces.length; i += 1) {
      const candidate = pieces
        .slice(i, i + size)
        .join('. ')
        .trim();

      if (!candidate) {
        continue;
      }

      const targetScore = languageScore(candidate, language);

      let competingScore = 0;

      for (const other of knownOtherLanguages) {
        if (other === language) {
          continue;
        }

        competingScore += languageScore(candidate, other);
      }

      /*
       * Penalizziamo molto i candidati che sembrano
       * appartenere soprattutto a un'altra lingua.
       */
      const finalScore =
        targetScore -
        competingScore * 0.6 -
        Math.max(0, candidate.length - 500) / 300;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        best = candidate;
      }
    }
  }

  if (bestScore >= 2.5) {
    return best;
  }

  return '';
}

function isUsableIngredientText(
  text: string,
  language: string,
): boolean {
  const cleaned = removeNutritionSection(normalizeText(text));

  if (!cleaned) {
    return false;
  }

  const extracted = extractBestLanguageChunk(cleaned, language);

  if (!extracted) {
    return false;
  }

  if (extracted.length < 8) {
    return false;
  }

  /*
   * Un testo che contiene moltissimi marcatori linguistici
   * è quasi sicuramente OCR multilingue non filtrato.
   */
  const markers = getLanguageMarkers(extracted);

  if (markers.length > 1) {
    return false;
  }

  return true;
}

function getIngredientTextForLanguage(
  product: Product,
  language: string,
): string {
  const withAllergens =
    product[`ingredients_text_with_allergens_${language}`];

  const plain =
    product[`ingredients_text_${language}`];

  const candidates = [withAllergens, plain].filter(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  );

  for (const candidate of candidates) {
    // Mostra il campo originale della lingua richiesta.
    // Rimuoviamo solo HTML/tag ed entità HTML: non traduciamo,
    // non correggiamo e non ricostruiamo il testo.
    const cleaned = decodeHtmlEntities(
      candidate
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .trim(),
    ).trim();

    if (cleaned) {
      return cleaned;
    }
  }

  const mainLanguage = String(
    product.ingredients_lc || product.lang || product.lc || '',
  )
    .trim()
    .toLowerCase();

  if (
    mainLanguage === language &&
    typeof product.ingredients_text === 'string'
  ) {
    return decodeHtmlEntities(
      product.ingredients_text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .trim(),
    ).trim();
  }

  return '';
}

function getSafeProductName(product: Product): string {
  return (
    product.product_name_it ||
    product.product_name ||
    product.product_name_en ||
    'Prodotto senza nome'
  );
}

function getAllergenStatus(
  product: Product,
  selectedAllergens: AllergenId[],
  ingredientText: string,
) {
  const selectedDefinitions = ALLERGENS.filter((item) =>
    selectedAllergens.includes(item.id),
  );

  if (!selectedDefinitions.length) {
    return {
      direct: [] as string[],
      possible: [] as string[],
    };
  }

  const directValues = [
    ...(Array.isArray(product.allergens_tags)
      ? product.allergens_tags
      : []),
    ...(Array.isArray(product.allergens_hierarchy)
      ? product.allergens_hierarchy
      : []),
  ]
    .map((value) => String(value).toLowerCase())
    .join(' ');

  const fromIngredients = String(
    product.allergens_from_ingredients || '',
  ).toLowerCase();

  const tracesValues = [
    ...(Array.isArray(product.traces_tags)
      ? product.traces_tags
      : []),
    String(product.traces || ''),
  ]
    .map((value) => String(value).toLowerCase())
    .join(' ');

  // IMPORTANT: the result must not change when the user changes the
  // displayed ingredient language. We therefore use the complete set of
  // ingredient texts loaded by the app, not only the currently selected one.
  const allIngredientText = ingredientText.toLowerCase();

  const possiblePhrases = [
    'può contenere',
    'puo contenere',
    'may contain',
    'peut contenir',
    'kann enthalten',
    'puede contener',
    'pode conter',
    'può contenere tracce',
    'may contain traces',
  ];

  const direct: string[] = [];
  const possible: string[] = [];

  for (const allergen of selectedDefinitions) {
    const tagMatched = allergen.tags.some((tag) =>
      directValues.includes(tag.toLowerCase()),
    );

    const directMetadataMatched = allergen.keywords.some((keyword) =>
      fromIngredients.includes(keyword.toLowerCase()),
    );

    const traceMatched = allergen.tags.some((tag) =>
      tracesValues.includes(tag.toLowerCase()),
    );

    const keywordMatched = allergen.keywords.some((keyword) =>
      allIngredientText.includes(keyword.toLowerCase()),
    );

    const possibleTextMatched = allergen.keywords.some((keyword) =>
      possiblePhrases.some((phrase) => {
        const phraseIndex = allIngredientText.indexOf(phrase);
        const keywordIndex = allIngredientText.indexOf(keyword.toLowerCase());
        return (
          phraseIndex >= 0 &&
          keywordIndex >= phraseIndex &&
          keywordIndex - phraseIndex < 100
        );
      }),
    );

    if (tagMatched || directMetadataMatched || (keywordMatched && !possibleTextMatched)) {
      direct.push(allergen.label);
      continue;
    }

    if (traceMatched || possibleTextMatched) {
      possible.push(allergen.label);
    }
  }

  return {
    direct: [...new Set(direct)],
    possible: [...new Set(possible.filter((item) => !direct.includes(item)))],
  };
}

function formatNumber(value: unknown): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return value.toLocaleString('it-IT', {
    maximumFractionDigits: 1,
  });
}

function IngredientLanguageButton({
  language,
  onPress,
}: {
  language: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.languageSelector}
      onPress={onPress}
    >
      <View>
        <Text style={styles.languageSelectorLabel}>
          Lingua ingredienti
        </Text>

        <Text style={styles.languageSelectorValue}>
          {LANGUAGE_NAMES[language] ?? language.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.languageSelectorArrow}>
        ▾
      </Text>
    </Pressable>
  );
}

function LanguagePickerModal({
  visible,
  languages,
  selectedLanguage,
  onSelect,
  onClose,
}: {
  visible: boolean;
  languages: string[];
  selectedLanguage: string;
  onSelect: (language: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.languageModalOverlay}
        onPress={onClose}
      >
        <Pressable
          style={styles.languageModal}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.languageModalTitle}>
            Scegli la lingua
          </Text>

          <Text style={styles.languageModalSubtitle}>
            Scegli la lingua con cui visualizzare gli ingredienti.
          </Text>

          <ScrollView
            style={styles.languageList}
            contentContainerStyle={styles.languageListContent}
            showsVerticalScrollIndicator={false}
          >
            {languages.map((language) => {
              const selected = language === selectedLanguage;

              return (
                <Pressable
                  key={language}
                  style={[
                    styles.languageOption,
                    selected && styles.languageOptionSelected,
                  ]}
                  onPress={() => onSelect(language)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      selected && styles.languageOptionTextSelected,
                    ]}
                  >
                    {LANGUAGE_NAMES[language] ??
                      language.toUpperCase()}
                  </Text>

                  {selected && (
                    <Text style={styles.languageCheck}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={styles.languageCloseButton}
            onPress={onClose}
          >
            <Text style={styles.languageCloseButtonText}>
              Chiudi
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function HomeScreen() {
  const cameraRef = useRef<any>(null);

  const [permission, requestPermission] =
    useCameraPermissions();

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [loadingProduct, setLoadingProduct] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const [selectedAllergens, setSelectedAllergens] =
    useState<AllergenId[]>([]);

  const [allergenModalVisible, setAllergenModalVisible] =
    useState(false);

  const [languagePickerVisible, setLanguagePickerVisible] =
    useState(false);

  const [ingredientLanguages, setIngredientLanguages] =
    useState<string[]>([]);

  const [ingredientsByLanguage, setIngredientsByLanguage] =
    useState<Record<string, string>>({});

  const [selectedIngredientLanguage, setSelectedIngredientLanguage] =
    useState('it');

  const [loadingIngredients, setLoadingIngredients] =
    useState(false);

  const allergenFile =
    `${FileSystem.documentDirectory}foodcheck-allergens.json`;

  useEffect(() => {
    loadSavedAllergens();
  }, []);

  async function loadSavedAllergens() {
    try {
      const info =
        await FileSystem.getInfoAsync(allergenFile);

      if (!info.exists) {
        return;
      }

      const raw =
        await FileSystem.readAsStringAsync(allergenFile);

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        setSelectedAllergens(
          parsed.filter((value) =>
            ALLERGENS.some((item) => item.id === value),
          ),
        );
      }
    } catch (error) {
      console.log(
        'FOODCHECK ALLERGEN LOAD ERROR',
        error,
      );
    }
  }

  async function saveAllergens(
    values: AllergenId[],
  ) {
    try {
      await FileSystem.writeAsStringAsync(
        allergenFile,
        JSON.stringify(values),
      );
    } catch (error) {
      console.log(
        'FOODCHECK ALLERGEN SAVE ERROR',
        error,
      );
    }
  }

  async function openScanner() {
    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        Alert.alert(
          'Fotocamera non disponibile',
          'FoodCheck ha bisogno dell’accesso alla fotocamera per leggere il codice a barre.',
        );

        return;
      }
    }

    setProduct(null);
    setCameraReady(false);
    setScanned(false);
    setCameraOpen(true);
  }

  function closeScanner() {
    setCameraOpen(false);
    setCameraReady(false);
    setScanned(false);
  }

  async function handleBarcodeScanned({
    data,
  }: {
    data: string;
    type: string;
  }) {
    if (scanned || loadingProduct) {
      return;
    }

    setScanned(true);

    const barcode = data.trim();

    if (!barcode) {
      setScanned(false);
      return;
    }

    await fetchProduct(barcode);
  }

  async function fetchProduct(barcode: string) {
    try {
      setLoadingProduct(true);

      const fields = [
        'product_name',
        'product_name_it',
        'product_name_en',
        'brands',
        'image_front_url',
        'nutriscore_grade',
        'lang',
        'lc',
        'ingredients_lc',
        'languages_codes',
        'languages',
        'ingredients_text',
        'ingredients_text_it',
        'ingredients_text_en',
        'ingredients_text_with_allergens',
        'ingredients_text_with_allergens_it',
        'ingredients_text_with_allergens_en',
        'allergens',
        'allergens_from_ingredients',
        'allergens_tags',
        'allergens_hierarchy',
        'traces',
        'traces_tags',
        'nutriments',
      ].join(',');

      const url =
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
          barcode,
        )}?lc=it&fields=${fields}`;

      console.log(
        'FOODCHECK API URL:',
        url,
      );

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'FoodCheck/1.0 (FoodCheck mobile app)',
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const data =
        (await response.json()) as ProductResponse;

      if (
        data.status !== 1 ||
        !data.product
      ) {
        Alert.alert(
          'Prodotto non trovato',
          'Open Food Facts non ha trovato informazioni per questo codice a barre.',
        );

        setScanned(false);
        return;
      }

      const currentProduct = data.product;

      setProduct(currentProduct);

      console.log(
        '===== FOODCHECK INGREDIENTI =====',
      );
      console.log(
        'lang:',
        currentProduct.lang,
      );
      console.log(
        'lc:',
        currentProduct.lc,
      );
      console.log(
        'ingredients_lc:',
        currentProduct.ingredients_lc,
      );
      console.log(
        'languages_codes:',
        currentProduct.languages_codes,
      );
      console.log(
        'ingredients_text_it:',
        currentProduct.ingredients_text_it,
      );
      console.log(
        'ingredients_text_en:',
        currentProduct.ingredients_text_en,
      );
      console.log(
        'ingredients_text:',
        currentProduct.ingredients_text,
      );
      console.log(
        '================================',
      );

      await loadIngredientLanguages(
        barcode,
        currentProduct,
      );
    } catch (error) {
      console.log(
        'FOODCHECK PRODUCT ERROR',
        error,
      );

      Alert.alert(
        'Errore',
        'Non è stato possibile recuperare il prodotto da Open Food Facts.',
      );

      setScanned(false);
    } finally {
      setLoadingProduct(false);
    }
  }

  async function loadIngredientLanguages(
    barcode: string,
    currentProduct: Product,
  ) {
    try {
      setLoadingIngredients(true);

      const declaredLanguages = Object.keys(
        currentProduct.languages_codes ?? {},
      )
        .filter((language) =>
          LANGUAGE_ORDER.includes(language),
        )
        .sort(
          (a, b) =>
            LANGUAGE_ORDER.indexOf(a) -
            LANGUAGE_ORDER.indexOf(b),
        );

      /*
       * Costruiamo dinamicamente i campi:
       * ingredients_text_it
       * ingredients_text_en
       * ingredients_text_fr
       * ...
       */
      const dynamicFields = new Set<string>();

      for (const language of declaredLanguages) {
        dynamicFields.add(
          `ingredients_text_${language}`,
        );

        dynamicFields.add(
          `ingredients_text_with_allergens_${language}`,
        );
      }

      /*
       * Includiamo sempre IT/EN/FR/DE/ES/PT
       * anche se languages_codes è incompleto.
       */
      // Italian and English are always requested when available.
      for (const language of [
        'it',
        'en',
        'fr',
        'de',
        'es',
        'pt',
      ]) {
        dynamicFields.add(
          `ingredients_text_${language}`,
        );

        dynamicFields.add(
          `ingredients_text_with_allergens_${language}`,
        );
      }

      const secondUrl =
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
          barcode,
        )}?fields=${Array.from(dynamicFields).join(',')}`;

      console.log(
        'FOODCHECK INGREDIENT LANGUAGES URL:',
        secondUrl,
      );

      const response = await fetch(
        secondUrl,
        {
          headers: {
            'User-Agent':
              'FoodCheck/1.0 (FoodCheck mobile app)',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const data =
        (await response.json()) as ProductResponse;

      const languageProduct =
        data.product ?? currentProduct;

      const available: string[] = [];

      const texts: Record<string, string> = {};

      /*
       * Prima proviamo le lingue dichiarate dal prodotto.
       */
      for (const language of declaredLanguages) {
        const text =
          getIngredientTextForLanguage(
            languageProduct,
            language,
          );

        if (text) {
          available.push(language);
          texts[language] = text;
        }
      }

      /*
       * Poi proviamo comunque le lingue comuni,
       * nel caso languages_codes fosse incompleto.
       */
      for (const language of [
        'it',
        'en',
        'fr',
        'de',
        'es',
        'pt',
        'nl',
        'pl',
        'ru',
        'zh',
        'ja',
        'ko',
      ]) {
        if (available.includes(language)) {
          continue;
        }

        const text =
          getIngredientTextForLanguage(
            languageProduct,
            language,
          );

        if (text) {
          available.push(language);
          texts[language] = text;
        }
      }

      /*
       * Se non abbiamo trovato alcuna lingua
       * ma il campo generico è valido, utilizziamo
       * la lingua principale dichiarata.
       */
      if (!available.length) {
        const genericLanguage =
          String(
            languageProduct.ingredients_lc ||
              languageProduct.lang ||
              '',
          )
            .trim()
            .toLowerCase();

        if (
          genericLanguage &&
          typeof languageProduct.ingredients_text ===
            'string'
        ) {
          const generic =
            extractBestLanguageChunk(
              languageProduct.ingredients_text,
              genericLanguage,
            );

          if (generic) {
            available.push(genericLanguage);
            texts[genericLanguage] =
              generic;
          }
        }
      }

      /*
       * Ordine definitivo:
       * Italiano, poi English, Français, ecc.
       */
      const ordered = [...new Set(available)].sort(
        (a, b) =>
          LANGUAGE_ORDER.indexOf(a) -
          LANGUAGE_ORDER.indexOf(b),
      );

      setIngredientLanguages(ordered);
      setIngredientsByLanguage(texts);

      /*
       * Italiano disponibile?
       *
       * Se sì -> selezioniamo automaticamente IT
       * e NON mostriamo il menu.
       *
       * Se no -> selezioniamo la prima lingua
       * disponibile. Se ce ne sono più di una,
       * il menu sarà disponibile all'utente.
       */
      if (
        ordered.includes('it') &&
        texts.it
      ) {
        setSelectedIngredientLanguage('it');
      } else if (ordered.length > 0) {
        setSelectedIngredientLanguage(
          ordered[0],
        );
      } else {
        setSelectedIngredientLanguage(
          'it',
        );
      }

      /*
       * Log utile per capire cosa ha trovato l'API.
       */
      console.log(
        '===== FOODCHECK LINGUE INGREDIENTI =====',
      );
      console.log(
        'available:',
        ordered,
      );
      console.log(
        'selected:',
        ordered.includes('it')
          ? 'it'
          : ordered[0] ?? 'none',
      );

      for (const language of ordered) {
        console.log(
          `${language}:`,
          texts[language],
        );
      }

      console.log(
        '========================================',
      );
    } catch (error) {
      console.log(
        'FOODCHECK INGREDIENT LANGUAGES ERROR',
        error,
      );

      /*
       * Fallback ai dati già presenti nella prima risposta.
       */
      const fallbackLanguages: string[] = [];
      const fallbackTexts: Record<string, string> = {};

      for (const language of [
        'it',
        'en',
        'fr',
        'de',
        'es',
        'pt',
      ]) {
        const text =
          getIngredientTextForLanguage(
            currentProduct,
            language,
          );

        if (text) {
          fallbackLanguages.push(language);
          fallbackTexts[language] =
            text;
        }
      }

      const genericLanguage =
        String(
          currentProduct.ingredients_lc ||
            currentProduct.lang ||
            '',
        )
          .trim()
          .toLowerCase();

      if (
        !fallbackLanguages.length &&
        genericLanguage &&
        currentProduct.ingredients_text
      ) {
        const generic =
          extractBestLanguageChunk(
            currentProduct.ingredients_text,
            genericLanguage,
          );

        if (generic) {
          fallbackLanguages.push(
            genericLanguage,
          );
          fallbackTexts[genericLanguage] =
            generic;
        }
      }

      const ordered = [
        ...new Set(fallbackLanguages),
      ].sort(
        (a, b) =>
          LANGUAGE_ORDER.indexOf(a) -
          LANGUAGE_ORDER.indexOf(b),
      );

      setIngredientLanguages(ordered);
      setIngredientsByLanguage(
        fallbackTexts,
      );

      if (
        ordered.includes('it') &&
        fallbackTexts.it
      ) {
        setSelectedIngredientLanguage('it');
      } else if (ordered.length) {
        setSelectedIngredientLanguage(
          ordered[0],
        );
      }
    } finally {
      setLoadingIngredients(false);
    }
  }

  function toggleAllergen(id: AllergenId) {
    setSelectedAllergens((current) => {
      const next = current.includes(id)
        ? current.filter(
            (item) => item !== id,
          )
        : [...current, id];

      saveAllergens(next);

      return next;
    });
  }

  function resetProduct() {
    setProduct(null);
    setIngredientsByLanguage({});
    setIngredientLanguages([]);
    setSelectedIngredientLanguage('it');
    setLanguagePickerVisible(false);
    setScanned(false);
  }

  function closeProduct() {
    resetProduct();
    closeScanner();
  }

  const selectedIngredientText =
    ingredientsByLanguage[
      selectedIngredientLanguage
    ] ?? '';

  const hasItalian =
    ingredientLanguages.includes('it') &&
    Boolean(ingredientsByLanguage.it);

  const shouldShowLanguagePicker =
    ingredientLanguages.length > 1;

  const allergenIngredientText = Object.values(
    ingredientsByLanguage,
  ).join('\n');

  const allergenStatus = useMemo(
    () =>
      product
        ? getAllergenStatus(
            product,
            selectedAllergens,
            allergenIngredientText,
          )
        : {
            direct: [],
            possible: [],
          },
    [
      product,
      selectedAllergens,
      allergenIngredientText,
    ],
  );

  const nutrition = product?.nutriments ?? {};

  const productName = product
    ? getSafeProductName(product)
    : '';

  /*
   * CAMERA
   */
  if (cameraOpen && !product) {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />

        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
            ],
          }}
          onCameraReady={() => {
            console.log(
              'FOODCHECK CAMERA READY',
            );

            setCameraReady(true);

            setTimeout(() => {
              try {
                cameraRef.current?.resumePreview?.();

                console.log(
                  'FOODCHECK PREVIEW RESUMED',
                );
              } catch (error) {
                console.log(
                  'FOODCHECK RESUME ERROR',
                  error,
                );
              }
            }, 150);
          }}
          onBarcodeScanned={
            cameraReady
              ? handleBarcodeScanned
              : undefined
          }
        />

        <SafeAreaView
          edges={['top']}
          style={styles.cameraHeaderSafe}
        >
          <View style={styles.cameraHeader}>
            <Pressable
              style={styles.cameraCloseButton}
              onPress={closeScanner}
            >
              <Text style={styles.cameraCloseText}>
                ×
              </Text>
            </Pressable>

            <View>
              <Text style={styles.cameraTitle}>
                Scansiona prodotto
              </Text>

              <Text style={styles.cameraSubtitle}>
                Inquadra il codice a barre
              </Text>
            </View>

            <View style={styles.cameraHeaderSpacer} />
          </View>
        </SafeAreaView>

        {loadingProduct && (
          <View style={styles.cameraLoading}>
            <ActivityIndicator
              size="large"
              color="#FFFFFF"
            />

            <Text style={styles.cameraLoadingText}>
              Ricerca prodotto...
            </Text>
          </View>
        )}
      </View>
    );
  }

  /*
   * PRODOTTO
   */
  if (product) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        <StatusBar style="dark" />

        <View style={styles.productHeader}>
          <Pressable
            style={styles.backButton}
            onPress={closeProduct}
          >
            <Text style={styles.backButtonText}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.productHeaderTitle}>
            Risultato
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.productScroll}
          contentContainerStyle={
            styles.productContent
          }
          showsVerticalScrollIndicator={false}
        >
          {product.image_front_url ? (
            <View style={styles.imageCard}>
              <Image
                source={{
                  uri: product.image_front_url,
                }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.noImageCard}>
              <Text style={styles.noImageText}>
                Immagine non disponibile
              </Text>
            </View>
          )}

          <View style={styles.productTitleBlock}>
            <Text style={styles.productName}>
              {productName}
            </Text>

            {!!product.brands && (
              <Text style={styles.productBrand}>
                {product.brands}
              </Text>
            )}

            {!!product.code && (
              <Text style={styles.productEan}>
                EAN {product.code}
              </Text>
            )}
          </View>

          {selectedAllergens.length > 0 && (
            <View
              style={[
                styles.alertCard,
                allergenStatus.direct.length > 0
                  ? styles.alertDirect
                  : allergenStatus.possible.length > 0
                    ? styles.alertPossible
                    : styles.alertSafe,
              ]}
            >
              {allergenStatus.direct.length >
              0 ? (
                <>
                  <Text
                    style={styles.alertTitle}
                  >
                    ❌ NON PUOI MANGIARLO
                  </Text>

                  <Text
                    style={styles.alertText}
                  >
                    Contiene uno o più allergeni che hai selezionato:
                  </Text>

                  <Text
                    style={styles.alertStrong}
                  >
                    {allergenStatus.direct.join(
                      ', ',
                    )}
                  </Text>
                </>
              ) : allergenStatus.possible.length >
                0 ? (
                <>
                  <Text
                    style={styles.alertTitle}
                  >
                    ⚠ PUÒ CONTENERE
                  </Text>

                  <Text
                    style={styles.alertText}
                  >
                    Il prodotto può contenere tracce di:
                  </Text>

                  <Text
                    style={styles.alertStrong}
                  >
                    {allergenStatus.possible.join(
                      ', ',
                    )}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={styles.alertTitle}
                  >
                    ✅ PUOI MANGIARLO
                  </Text>

                  <Text
                    style={styles.alertText}
                  >
                    Nessuno degli allergeni che hai selezionato è stato rilevato.
                  </Text>
                </>
              )}
            </View>
          )}

          {product.nutriscore_grade ? (
            <View style={styles.nutriCard}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  NUTRI-SCORE
                </Text>

                <Text style={styles.nutriTitle}>
                  Valutazione nutrizionale
                </Text>
              </View>

              <View
                style={[
                  styles.nutriBadge,
                  {
                    backgroundColor:
                      product.nutriscore_grade
                        .toLowerCase() === 'a'
                        ? '#2E8B57'
                        : product.nutriscore_grade
                              .toLowerCase() === 'b'
                          ? '#8DBB3A'
                          : product.nutriscore_grade
                                .toLowerCase() === 'c'
                            ? '#E6B93D'
                            : product.nutriscore_grade
                                  .toLowerCase() === 'd'
                              ? '#E57B2A'
                              : '#D9534F',
                  },
                ]}
              >
                <Text style={styles.nutriBadgeText}>
                  {product.nutriscore_grade.toUpperCase()}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  INGREDIENTI
                </Text>

                <Text style={styles.sectionTitle}>
                  Lista ingredienti
                </Text>
              </View>

              {loadingIngredients && (
                <ActivityIndicator
                  size="small"
                  color="#24391E"
                />
              )}
            </View>

            {shouldShowLanguagePicker && (
              <IngredientLanguageButton
                language={
                  selectedIngredientLanguage
                }
                onPress={() =>
                  setLanguagePickerVisible(true)
                }
              />
            )}

            {!loadingIngredients &&
              ingredientLanguages.length === 1 &&
              !hasItalian && (
                <View style={styles.singleLanguageBadge}>
                  <Text
                    style={
                      styles.singleLanguageBadgeText
                    }
                  >
                    {LANGUAGE_NAMES[
                      ingredientLanguages[0]
                    ] ??
                      ingredientLanguages[0].toUpperCase()}
                  </Text>
                </View>
              )}

            {selectedIngredientText ? (
              <Text
                style={styles.ingredientsText}
                selectable
              >
                {selectedIngredientText}
              </Text>
            ) : (
              <Text style={styles.emptyText}>
                Gli ingredienti non sono disponibili
                per questo prodotto.
              </Text>
            )}

            <Text style={styles.languageInfo}>
              {hasItalian
                ? 'Lingua: Italiano'
                : selectedIngredientLanguage
                  ? `Lingua: ${
                      LANGUAGE_NAMES[
                        selectedIngredientLanguage
                      ] ??
                      selectedIngredientLanguage.toUpperCase()
                    }`
                  : 'Lingua non disponibile'}
            </Text>
          </View>



          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  NUTRIZIONE
                </Text>

                <Text style={styles.sectionTitle}>
                  Valori per 100 g
                </Text>
              </View>
            </View>

            <View style={styles.nutritionGrid}>
              <NutritionItem
                label="Energia"
                value={
                  nutrition['energy-kcal_100g']
                    ? `${formatNumber(
                        nutrition[
                          'energy-kcal_100g'
                        ],
                      )} kcal`
                    : '-'
                }
              />

              <NutritionItem
                label="Grassi"
                value={`${formatNumber(
                  nutrition['fat_100g'],
                )} g`}
              />

              <NutritionItem
                label="Saturi"
                value={`${formatNumber(
                  nutrition[
                    'saturated-fat_100g'
                  ],
                )} g`}
              />

              <NutritionItem
                label="Carboidrati"
                value={`${formatNumber(
                  nutrition[
                    'carbohydrates_100g'
                  ],
                )} g`}
              />

              <NutritionItem
                label="Zuccheri"
                value={`${formatNumber(
                  nutrition['sugars_100g'],
                )} g`}
              />

              <NutritionItem
                label="Proteine"
                value={`${formatNumber(
                  nutrition['proteins_100g'],
                )} g`}
              />

              <NutritionItem
                label="Sale"
                value={`${formatNumber(
                  nutrition['salt_100g'],
                )} g`}
              />

              <NutritionItem
                label="Fibre"
                value={`${formatNumber(
                  nutrition['fiber_100g'],
                )} g`}
              />
            </View>
          </View>

          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerTitle}>
              Nota importante
            </Text>

            <Text style={styles.disclaimerText}>
              Le informazioni di FoodCheck provengono
              da Open Food Facts e possono essere
              incomplete, errate o riferite a una
              specifica versione del prodotto. Per
              allergie o intolleranze, verifica sempre
              gli ingredienti e le indicazioni sulla
              confezione fisica.
            </Text>
          </View>

          <Pressable
            style={styles.scanAnotherButton}
            onPress={() => {
              resetProduct();
              setCameraReady(false);
              setScanned(false);
            }}
          >
            <Text style={styles.scanAnotherButtonText}>
              Scansiona un altro prodotto
            </Text>
          </Pressable>
        </ScrollView>

        <LanguagePickerModal
          visible={languagePickerVisible}
          languages={ingredientLanguages}
          selectedLanguage={
            selectedIngredientLanguage
          }
          onSelect={(language) => {
            setSelectedIngredientLanguage(
              language,
            );
            setLanguagePickerVisible(false);
          }}
          onClose={() =>
            setLanguagePickerVisible(false)
          }
        />
      </SafeAreaView>
    );
  }

  /*
   * HOME
   */
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <StatusBar style="dark" />

      <ScrollView
        style={styles.homeScroll}
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.appEyebrow}>
              FOODCHECK
            </Text>

            <Text style={styles.homeTitle}>
              Controlla cosa mangi.
            </Text>

            <Text style={styles.homeSubtitle}>
              Scansiona un prodotto e verifica
              ingredienti e allergeni.
            </Text>
          </View>
        </View>

        <View style={styles.allergenCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                PROFILO
              </Text>

              <Text style={styles.sectionTitle}>
                I miei allergeni
              </Text>
            </View>

            <Pressable
              style={styles.editAllergensButton}
              onPress={() =>
                setAllergenModalVisible(true)
              }
            >
              <Text
                style={styles.editAllergensText}
              >
                {selectedAllergens.length
                  ? 'Modifica'
                  : 'Aggiungi'}
              </Text>
            </Pressable>
          </View>

          {selectedAllergens.length > 0 ? (
            <View style={styles.allergenChips}>
              {ALLERGENS.filter((item) =>
                selectedAllergens.includes(
                  item.id,
                ),
              ).map((item) => (
                <View
                  key={item.id}
                  style={styles.allergenChip}
                >
                  <Text
                    style={
                      styles.allergenChipText
                    }
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Nessun allergene selezionato. Aggiungili
              per ricevere avvisi durante la scansione.
            </Text>
          )}
        </View>

        <Pressable
          style={styles.scanButton}
          onPress={openScanner}
        >
          <View style={styles.scanButtonIcon}>
            <Text style={styles.scanButtonIconText}>
              ▣
            </Text>
          </View>

          <View style={styles.scanButtonContent}>
            <Text style={styles.scanButtonTitle}>
              Scansiona prodotto
            </Text>

            <Text style={styles.scanButtonSubtitle}>
              Leggi il codice a barre
            </Text>
          </View>

          <Text style={styles.scanButtonArrow}>
            ›
          </Text>
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Come funziona
          </Text>

          <Text style={styles.infoText}>
            1. Imposta i tuoi allergeni.
          </Text>

          <Text style={styles.infoText}>
            2. Scansiona il codice del prodotto.
          </Text>

          <Text style={styles.infoText}>
            3. FoodCheck recupera gli ingredienti
            disponibili e controlla gli allergeni.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={allergenModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setAllergenModalVisible(false)
        }
      >
        <View style={styles.allergenModalOverlay}>
          <View style={styles.allergenModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  I miei allergeni
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Seleziona gli allergeni da controllare.
                </Text>
              </View>

              <Pressable
                style={styles.modalClose}
                onPress={() =>
                  setAllergenModalVisible(false)
                }
              >
                <Text
                  style={styles.modalCloseText}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.allergenList}
              contentContainerStyle={
                styles.allergenListContent
              }
              showsVerticalScrollIndicator={false}
            >
              {ALLERGENS.map((item) => {
                const selected =
                  selectedAllergens.includes(
                    item.id,
                  );

                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.allergenRow,
                      selected &&
                        styles.allergenRowSelected,
                    ]}
                    onPress={() =>
                      toggleAllergen(item.id)
                    }
                  >
                    <View style={styles.checkbox}>
                      {selected && (
                        <Text
                          style={
                            styles.checkboxTick
                          }
                        >
                          ✓
                        </Text>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.allergenRowText,
                        selected &&
                          styles.allergenRowTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.saveAllergensButton}
              onPress={() =>
                setAllergenModalVisible(false)
              }
            >
              <Text
                style={
                  styles.saveAllergensButtonText
                }
              >
                Salva
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function NutritionItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.nutritionItem}>
      <Text style={styles.nutritionLabel}>
        {label}
      </Text>

      <Text style={styles.nutritionValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F4',
  },

  homeScroll: {
    flex: 1,
  },

  homeContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  homeHeader: {
    marginBottom: 22,
  },

  appEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#24391E',
    marginBottom: 8,
  },

  homeTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#172013',
  },

  homeSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#6C7468',
    maxWidth: 340,
  },

  allergenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E7EAE3',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#899185',
    marginBottom: 5,
  },

  sectionTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#1F271D',
  },

  editAllergensButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#EFF4EA',
  },

  editAllergensText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#24391E',
  },

  allergenChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },

  allergenChip: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: '#F2F4EF',
    borderWidth: 1,
    borderColor: '#E5E9E1',
  },

  allergenChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52604D',
  },

  emptyText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: '#7D8479',
  },

  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24391E',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },

  scanButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#354B2E',
  },

  scanButtonIconText: {
    fontSize: 25,
    color: '#FFFFFF',
  },

  scanButtonContent: {
    flex: 1,
    marginLeft: 14,
  },

  scanButtonTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  scanButtonSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#CBD6C6',
  },

  scanButtonArrow: {
    fontSize: 30,
    color: '#FFFFFF',
    marginLeft: 8,
  },

  infoCard: {
    borderRadius: 20,
    backgroundColor: '#EDF2E8',
    padding: 18,
  },

  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#24391E',
    marginBottom: 10,
  },

  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#536052',
    marginBottom: 5,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  cameraHeaderSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraCloseText: {
    fontSize: 34,
    lineHeight: 36,
    color: '#FFFFFF',
    fontWeight: '300',
  },

  cameraTitle: {
    marginLeft: 13,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  cameraSubtitle: {
    marginLeft: 13,
    marginTop: 2,
    fontSize: 12,
    color: '#E4E4E4',
  },

  cameraHeaderSpacer: {
    flex: 1,
  },

  cameraLoading: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraLoadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#F7F8F4',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E7DF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    fontSize: 34,
    lineHeight: 36,
    color: '#24391E',
    fontWeight: '300',
    marginTop: -3,
  },

  productHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#1F271D',
  },

  headerSpacer: {
    width: 42,
  },

  productScroll: {
    flex: 1,
  },

  productContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },

  imageCard: {
    height: 280,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EAE3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 18,
  },

  productImage: {
    width: '90%',
    height: '90%',
  },

  noImageCard: {
    height: 220,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EAE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  noImageText: {
    fontSize: 14,
    color: '#8A9187',
  },

  productTitleBlock: {
    marginBottom: 18,
  },

  productName: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    color: '#182016',
  },

  productBrand: {
    marginTop: 6,
    fontSize: 15,
    color: '#687066',
  },

  productEan: {
    marginTop: 7,
    fontSize: 12,
    color: '#92988F',
    letterSpacing: 0.4,
  },

  nutriCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E9E1',
  },

  nutriTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#283027',
  },

  nutriBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nutriBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E9E1',
  },

  ingredientsText: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 23,
    color: '#344033',
  },

  languageInfo: {
    marginTop: 13,
    fontSize: 11,
    fontWeight: '700',
    color: '#8A9187',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  languageSelector: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE2D8',
    backgroundColor: '#F6F8F4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  languageSelectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A9187',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  languageSelectorValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '800',
    color: '#24391E',
  },

  languageSelectorArrow: {
    fontSize: 20,
    color: '#24391E',
    marginLeft: 10,
  },

  singleLanguageBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: '#F0F3EC',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  singleLanguageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#687264',
    textTransform: 'uppercase',
  },

  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  languageModal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 18,
  },

  languageModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F271D',
  },

  languageModalSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#7C8478',
  },

  languageList: {
    marginTop: 14,
  },

  languageListContent: {
    gap: 8,
    paddingBottom: 8,
  },

  languageOption: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#F6F7F4',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  languageOptionSelected: {
    backgroundColor: '#EAF0E5',
    borderWidth: 1,
    borderColor: '#C8D6BE',
  },

  languageOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#414A3E',
  },

  languageOptionTextSelected: {
    color: '#24391E',
  },

  languageCheck: {
    fontSize: 18,
    fontWeight: '900',
    color: '#24391E',
  },

  languageCloseButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#24391E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  languageCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  alertCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },

  alertDirect: {
    backgroundColor: '#FFF0EF',
    borderColor: '#F2C4C0',
  },

  alertPossible: {
    backgroundColor: '#FFF7E9',
    borderColor: '#F0D59C',
  },

  alertSafe: {
    backgroundColor: '#EDF7EE',
    borderColor: '#C6DFC8',
  },

  alertTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#263023',
  },

  alertText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#50584D',
  },

  alertStrong: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: '#283126',
  },

  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 10,
  },

  nutritionItem: {
    width: '47%',
    borderRadius: 14,
    backgroundColor: '#F6F8F4',
    padding: 12,
  },

  nutritionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A9187',
    textTransform: 'uppercase',
  },

  nutritionValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '800',
    color: '#263023',
  },

  disclaimerCard: {
    borderRadius: 18,
    backgroundColor: '#F0F2ED',
    padding: 16,
    marginBottom: 14,
  },

  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#596255',
    marginBottom: 5,
  },

  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#72796F',
  },

  scanAnotherButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#24391E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanAnotherButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  allergenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },

  allergenModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    maxHeight: '88%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F271D',
  },

  modalSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: '#7C8478',
  },

  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#4F584B',
    fontWeight: '300',
  },

  allergenList: {
    maxHeight: 530,
  },

  allergenListContent: {
    gap: 8,
    paddingBottom: 12,
  },

  allergenRow: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: '#F6F7F4',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  allergenRowSelected: {
    backgroundColor: '#EAF0E5',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#BEC8B9',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  checkboxTick: {
    fontSize: 16,
    fontWeight: '900',
    color: '#24391E',
  },

  allergenRowText: {
    flex: 1,
    fontSize: 15,
    color: '#465044',
    fontWeight: '600',
  },

  allergenRowTextSelected: {
    color: '#24391E',
    fontWeight: '800',
  },

  saveAllergensButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#24391E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  saveAllergensButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});