import { createStore } from 'idb-keyval';


// Favorite
export const favoritesDb = createStore('Palette', 'Favorites');
// export const STORE_KEYS = {
//   /**
//    * Favorite Colors
//    */
//   favColors: 'Colors',
//   /**
//    * Favorite Palettes
//    */
//   favPlts: 'Plts',
// }
// -Key: Favorite Colors
export const STORE_FAV_COLORS = 'Colors';
// -Key: Favorite Palettes
export const STORE_FAV_PLTS = 'Plts';
