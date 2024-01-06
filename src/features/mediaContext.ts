import {createContext} from "react";
import {MediaContextType} from "./types/mediaType";

const MediaContext = createContext<MediaContextType>({
  windowSize: [2, 2],
  headerHeight: 0,
  isSmall: true,
  pos: "left",
  clientPos: "clientX",
  bound: [0, 1],
});
export default MediaContext;
