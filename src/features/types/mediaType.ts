
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
   * Card pos along flow direction.
   */
  pos: "left" | "top",
  /**
   * Cursor pos along flow direction.
   */
  clientPos: "clientX" | "clientY"
}
