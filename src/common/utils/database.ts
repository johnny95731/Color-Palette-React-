import { createStore } from 'idb-keyval';


// Favorite
export const favoritesDb = createStore('Palette', 'Favorites');
// -Key: Favorite Colors
export const STORE_FAV_COLORS = 'Colors';
// -Key: Favorite Palettes
export const STORE_FAV_PLTS = 'Plts';
