// Events
export const preventDefault = (e: MouseEvent) => {
  e.preventDefault();
  return false;
};
/**
 * Remove non-hex text and add "#" to first word.
 * @param e Triggered mouse event.
 */
export const hexTextEdited = (
    e: React.ChangeEvent<HTMLInputElement>,
): void => {
  const textInput = e.currentTarget;
  let text = (textInput.value);
  text = text.replace(/[^A-F0-9]/ig, '');
  textInput.value = `#${text.toUpperCase()}`;
};
/**
 * Copy Hex text to clipboard (excludes "#").
 * @param e Triggered mouse event.
 */
export const copyHex = (
    e: React.MouseEvent<HTMLDivElement | HTMLSpanElement>,
): void => {
  const target = e.currentTarget;
  if (!target) return;
  const text = target.innerText;
  const brIdx = text.indexOf('\n'); // index of break.
  const start = text.startsWith('#') ? 1 : 0;
  let hex: string;
  if (brIdx > -1) {
    hex = text.slice(start, brIdx);
  } else {
    hex = text.slice(start);
  }
  try {
    navigator.clipboard.writeText(hex);
  } catch (err) {
    console.error('copy hex error:', err);
  }
};

// export const showdropdownMenu = (
//     e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
// ) => {
//   const target = e.currentTarget;
//   const content = target.lastChild as HTMLElement;
//   if ((e as React.FocusEvent).type === 'blur') {
//     content.style.maxHeight = '';
//     return;
//   }
//   /**
//    * To deal with nested-menu. Click outer menu's content has 2 cases:
//    * 1. Non-menu component: This function will be called by outer menu. Trigger
//    *    button event and close outer menu's content.
//    * 2. Menu-like (Menu, Select, ...) component: This function will be called by
//    *    inner menu. Stop propagation to avoid closing outer menu, and open
//    *    inner's menu content.
//    */
//   if (!content.contains(e.target as Node)) {
//     e.stopPropagation();
//   }
//   const height = content.style.maxHeight;
//   if (height === '') {
//     content.style.maxHeight = '100vh';
//   } else {
//     content.style.maxHeight = '';
//     target.blur();
//   }
// };
