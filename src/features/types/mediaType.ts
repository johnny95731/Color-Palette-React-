
export type MediaContextType = {
  /**
   * The device size, [height, width].
   */
  windowSize: [number, number];
  /**
   * Height of header.
   */
  headerHeight: number;
  /**
   * The device is small (width <= 900px) or not.
   */
  isSmall: boolean;
  /**
   * Card pos along flow direction. For getting data from event.
   */
  pos: 'left' | 'top';
  /**
   * Cursor pos direction along flow direction. For getting data from event.
   */
  clientPos: 'clientX' | 'clientY';
  /**
   * Main region boundary. For adjusting DOM position or varifying cursor
   * position.
   */
  bound: [number, number];
}
