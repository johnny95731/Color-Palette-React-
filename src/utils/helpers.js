import {update, createStore} from "idb-keyval";
// Sorting
/**
 * Shuffle an array by Fisher-Yates shuffle. The process will change input
 * array.
 * @param {Array} arr The array be shuffled.
 */
export const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

// DOM
/**
 * Remove non-hex text and add "#" to first word.
 * @param {Event} e Triggered event.
 */
export const hexTextEdited = (e) => {
  const textInput = (e.target || e.srcElement);
  let text = (textInput.value).toUpperCase();
  text = text.replace(/[^A-F0-9]/g, "");
  textInput.value = `#${text}`;
};

/**
 * Copy Hex text to clipboard (excludes "#").
 * @param {Event} e Triggered event.
 */
export const copyHex = (e) => {
  let target = (e.target || e.srcElement);
  if (target.nodeName === "IMG") {
    target = target.offsetParent;
  }
  const text = target.innerText;
  const brIdx = text.indexOf("\n"); // index of break.
  const start = text.startsWith("#") ? 1 : 0;
  let hex;
  if (brIdx > -1) {
    hex = text.slice(start, brIdx);
  } else {
    hex = text.slice(start);
  }
  navigator.clipboard.writeText(hex);
  target.lastChild.innerText = "Copied."; // Tooltip
};

// Database
export const colorsDb = createStore("Palatte", "Colors");
// -Single Color
update("FavColors", (prev) => { // Initialize value
  if (!prev) return [];
  else return prev;
}, colorsDb);
// -Palette
update("FavPlt", (prev) => { // Initialize value
  if (!prev) return [];
  else return prev;
}, colorsDb);
// -Options
export const optionsDb = createStore("Palatte", "Options");
