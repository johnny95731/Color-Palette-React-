import React from 'react';

/**
 * React mouse event handler. For connecting to JSX element.
 */
export type MouseHandler = {
  (e: React.MouseEvent<HTMLElement>): any;
};
/**
 * React focus event handler. For connecting to JSX element.
 */
export type FocusHandler = {
  (e: React.FocusEvent<HTMLElement>): any;
};
/**
 * React focus event handler. For connecting to JSX element.
 */
export type TouchHandler = {
  (e: React.TouchEvent<HTMLElement>): any;
};
