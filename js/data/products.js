/**
 * RAWANE — catalogue data.
 *
 * This file is the single source of truth for products. The UI reads it and
 * never hard-codes product content, so you can edit, add or remove products
 * here without touching any other file.
 *
 * IMPORTANT — mock data:
 *   Names, prices, descriptions and variants are illustrative placeholders
 *   inspired by the kinds of pieces sold by Moroccan fashion-jewelry boutiques.
 *   Material, plating, stone and dimension information has intentionally been
 *   left out (`materials: null`) because it has not been verified. Fill these
 *   fields in with real supplier data before going live; the product sheet
 *   only displays them when they are set.
 *
 * Product shape:
 *   id          unique slug, used in URLs (#/produit/<id>)
 *   name        display name
 *   category    one of the `categories` ids below
 *   price       base price in MAD (integer)
 *   compareAt   optional previous price in MAD, shows a sale badge
 *   image       path to the product photo (4:5)
 *   alt         accessible description of the photo
 *   description short editorial text (style only, no unverified specs)
 *   variants    [{ name, options: [{ label, priceDelta?, soldOut? }] }]
 *   tags        free-form; "nouveau", "best-seller" and "lumiere" are used by the UI
 *   materials   null until verified
 */

export const currency = { code: 'MAD', locale: 'fr-MA' };

export const categories = [
  { id: 'colliers', label: 'Colliers', singular: 'Collier', image: 'assets/images/editorial/sunlight.jpg', blurb: 'Lumière sur la nuque' },
  { id: 'bagues', label: 'Bagues', singular: 'Bague', image: 'assets/images/editorial/dish.jpg', blurb: 'Le geste, sublimé' },
  { id: 'boucles', label: "Boucles d'oreilles", singular: "Boucles d'oreilles", image: 'assets/images/editorial/hoops-model.jpg', blurb: 'Un éclat près du visage' },
  { id: 'bracelets', label: 'Bracelets', singular: 'Bracelet', image: 'assets/images/editorial/wrist.jpg', blurb: 'Au poignet, en douceur' },
];

const necklaceLength = { name: 'Longueur', options: [{ label: '40 cm' }, { label: '45 cm' }] };
const ringSize = { name: 'Taille', options: [{ label: '50' }, { label: '52' }, { label: '54' }, { label: '56' }, { label: '58' }] };

export const products = [
  // — Colliers —
  {
    id: 'collier-halo-yasmine',
    name: 'Collier Halo Yasmine',
    category: 'colliers',
    price: 289,
    image: 'assets/images/products/n1.jpg',
    alt: 'Collier doré à pendentif anneau ovale posé sur du sable',
    description: "Un anneau ovale, glissé sur une chaîne souple. Une ligne pure qui se porte seule ou en accumulation.",
    variants: [necklaceLength],
    tags: ['lumiere', 'best-seller'],
    materials: null,
  },
  {
    id: 'choker-selma',
    name: 'Choker Selma',
    category: 'colliers',
    price: 249,
    image: 'assets/images/products/n2.jpg',
    alt: 'Choker doré à maille plate porté avec un blazer noir',
    description: "Une maille plate et lumineuse qui épouse le cou. Le bijou des cols ouverts et des soirs élégants.",
    variants: [{ name: 'Longueur', options: [{ label: '36 cm' }, { label: '40 cm' }] }],
    tags: ['nouveau'],
    materials: null,
  },
  {
    id: 'collier-medailles-ines',
    name: 'Collier Médailles Inès',
    category: 'colliers',
    price: 269,
    image: 'assets/images/products/n3.jpg',
    alt: 'Colliers dorés superposés à petites médailles portés sur une chemise blanche',
    description: "De petites médailles qui captent la lumière à chaque mouvement. Pensé pour être superposé.",
    variants: [necklaceLength],
    tags: [],
    materials: null,
  },
  {
    id: 'collier-goutte-amira',
    name: 'Collier Goutte Amira',
    category: 'colliers',
    price: 319,
    compareAt: 359,
    image: 'assets/images/products/n4.jpg',
    alt: 'Collier doré à pendentif goutte présenté sur un buste blanc',
    description: "Un pendentif en forme de goutte, ciselé comme une parure ancienne. Une pièce signature.",
    variants: [necklaceLength],
    tags: ['lumiere'],
    materials: null,
  },
  {
    id: 'collier-cercle-layla',
    name: 'Collier Cercle Layla',
    category: 'colliers',
    price: 259,
    image: 'assets/images/products/x4.jpg',
    alt: 'Collier à double chaîne dorée et cercle ouvert sur fond noir',
    description: "Deux chaînes réunies par un cercle ouvert. Graphique, aérien, intemporel.",
    variants: [necklaceLength],
    tags: [],
    materials: null,
  },

  // — Bagues —
  {
    id: 'bague-solitaire-noor',
    name: 'Bague Solitaire Noor',
    category: 'bagues',
    price: 229,
    image: 'assets/images/products/r1.jpg',
    alt: 'Bague dorée solitaire à pierre taille émeraude',
    description: "Une pierre taille émeraude, portée haut sur un anneau délicatement serti. L'éclat à l'état pur.",
    variants: [ringSize],
    tags: ['lumiere', 'best-seller'],
    materials: null,
  },
  {
    id: 'bague-vague-salma',
    name: 'Bague Vague Salma',
    category: 'bagues',
    price: 189,
    image: 'assets/images/products/r2.jpg',
    alt: 'Bague dorée à motif de vague posée dans une coupelle blanche',
    description: "Des lignes ondulées comme une vague figée dans la lumière. Se porte seule ou en duo.",
    variants: [ringSize],
    tags: [],
    materials: null,
  },
  {
    id: 'bague-eternite-rim',
    name: 'Bague Éternité Rim',
    category: 'bagues',
    price: 249,
    image: 'assets/images/products/r3.jpg',
    alt: 'Anneau doré serti de pierres taille baguette',
    description: "Une ronde de pierres taille baguette, tout autour du doigt. Pour les promesses et les jours ordinaires.",
    variants: [{ name: 'Taille', options: [{ label: '50' }, { label: '52' }, { label: '54', soldOut: true }, { label: '56' }] }],
    tags: ['nouveau'],
    materials: null,
  },
  {
    id: 'bague-maille-kenza',
    name: 'Bague Maille Kenza',
    category: 'bagues',
    price: 159,
    image: 'assets/images/products/r4.jpg',
    alt: 'Bague dorée en maille gourmette posée sur un tissu blanc',
    description: "Une maille gourmette refermée en anneau. Un classique revisité, souple et désinvolte.",
    variants: [ringSize],
    tags: [],
    materials: null,
  },
  {
    id: 'bague-bouquet-dounia',
    name: 'Bague Bouquet Dounia',
    category: 'bagues',
    price: 219,
    image: 'assets/images/products/x1.jpg',
    alt: 'Bague cocktail dorée sertie de pierres champagne en grappe',
    description: "Un bouquet de pierres aux reflets champagne, assemblées comme une fleur. Le goût du détail.",
    variants: [ringSize],
    tags: ['best-seller'],
    materials: null,
  },

  // — Boucles d'oreilles —
  {
    id: 'boucles-goutte-hiba',
    name: 'Boucles Goutte Hiba',
    category: 'boucles',
    price: 199,
    image: 'assets/images/products/e1.jpg',
    alt: "Boucles d'oreilles dorées en forme de goutte sur fond blanc",
    description: "Une goutte bombée et lisse qui reflète la lumière. Moderne, sculpturale, facile à porter.",
    variants: [],
    tags: ['lumiere', 'best-seller'],
    materials: null,
  },
  {
    id: 'creoles-sahar',
    name: 'Créoles Sahar',
    category: 'boucles',
    price: 179,
    image: 'assets/images/products/e2.jpg',
    alt: 'Créoles dorées épaisses posées sur un présentoir blanc',
    description: "Des créoles généreuses à la ligne arrondie. Trois tailles pour trois humeurs.",
    variants: [{ name: 'Taille', options: [{ label: 'S', priceDelta: -20 }, { label: 'M' }, { label: 'L', priceDelta: 20 }] }],
    tags: [],
    materials: null,
  },
  {
    id: 'puces-perle-lamia',
    name: 'Puces Perle Lamia',
    category: 'boucles',
    price: 149,
    image: 'assets/images/products/e3.jpg',
    alt: "Boucles d'oreilles perle et boule dorée sur fond beige ensoleillé",
    description: "Une perle douce associée à une petite sphère dorée. L'élégance discrète du quotidien.",
    variants: [],
    tags: ['nouveau'],
    materials: null,
  },
  {
    id: 'creoles-torsadees-zineb',
    name: 'Créoles Torsadées Zineb',
    category: 'boucles',
    price: 189,
    image: 'assets/images/products/e4.jpg',
    alt: 'Créoles dorées torsadées posées sur des galets',
    description: "Une torsade travaillée qui joue avec les ombres. Un bijou de caractère, tout en finesse.",
    variants: [],
    tags: [],
    materials: null,
  },
  {
    id: 'mini-creoles-aya',
    name: 'Mini-créoles Aya',
    category: 'boucles',
    price: 129,
    image: 'assets/images/products/x2.jpg',
    alt: 'Petites créoles dorées sur fond blanc',
    description: "De petites créoles qui embrassent le lobe. Celles que l'on ne quitte plus.",
    variants: [],
    tags: ['best-seller'],
    materials: null,
  },

  // — Bracelets —
  {
    id: 'bracelet-plaque-yara',
    name: 'Bracelet Plaque Yara',
    category: 'bracelets',
    price: 199,
    image: 'assets/images/products/b1.jpg',
    alt: 'Bracelet chaîne fine à plaque dorée porté au poignet',
    description: "Une plaque lisse sur une chaîne fine. Un bracelet à garder pour soi ou à offrir.",
    variants: [],
    tags: ['lumiere'],
    materials: null,
  },
  {
    id: 'jonc-trois-lumieres-ghita',
    name: 'Jonc Trois Lumières Ghita',
    category: 'bracelets',
    price: 239,
    image: 'assets/images/products/b2.jpg',
    alt: 'Jonc doré orné de trois pierres ambrées',
    description: "Trois pierres aux tons ambrés posées sur un jonc fin. Comme trois éclats de soleil.",
    variants: [{ name: 'Taille', options: [{ label: 'S/M' }, { label: 'M/L' }] }],
    tags: ['nouveau'],
    materials: null,
  },
  {
    id: 'bracelet-breloques-maya',
    name: 'Bracelet Breloques Maya',
    category: 'bracelets',
    price: 179,
    image: 'assets/images/products/b3.jpg',
    alt: 'Bracelets chaînes fines dorées à petites breloques',
    description: "Une chaîne délicate ponctuée de petites breloques. Légère comme un murmure.",
    variants: [],
    tags: [],
    materials: null,
  },
  {
    id: 'bracelet-maille-nada',
    name: 'Bracelet Maille Nada',
    category: 'bracelets',
    price: 229,
    compareAt: 259,
    image: 'assets/images/products/b4.jpg',
    alt: 'Bracelet doré à grosse maille posé sur un magazine',
    description: "Une maille forte, assumée, qui affirme le poignet. Le bracelet des tenues minimalistes.",
    variants: [],
    tags: ['best-seller'],
    materials: null,
  },
  {
    id: 'bracelet-trombone-sofia',
    name: 'Bracelet Trombone Sofia',
    category: 'bracelets',
    price: 169,
    image: 'assets/images/products/x3.jpg',
    alt: 'Bracelet doré à maille trombone porté au poignet',
    description: "Une maille trombone allongée, moderne et lumineuse. Se superpose à l'infini.",
    variants: [],
    tags: [],
    materials: null,
  },
];

/** Products shown in the home-page featured carousel ("La Collection Lumière"). */
export const featuredCollection = {
  eyebrow: 'Collection signature',
  title: 'La Collection Lumière',
  subtitle: 'Des pièces pensées pour les instants qui comptent.',
  productIds: products.filter((p) => p.tags.includes('lumiere')).map((p) => p.id),
};

/** Shop-wide settings the UI relies on. */
export const shop = {
  freeShippingThreshold: 500,
  // Flat delivery fee below the threshold — placeholder, set your real carrier rate.
  shippingFee: 35,
};
