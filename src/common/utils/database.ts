import {createStore} from "idb-keyval";

// Favorite
export const favoritesDb = createStore("Palette", "Favorites");
// -Key: Favorite Colors
export const FAV_COLORS = "Colors";
// -Key: Favorite Palettes
export const FAV_PLTS = "Plts";

// Options, include mixing mode, edit mode
export const optionsDb = createStore("Palette", "Options");
