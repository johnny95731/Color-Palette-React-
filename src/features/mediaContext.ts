import {createContext} from "react";
import {MediaContextType} from "./types/mediaType";

const MediaContext = createContext<MediaContextType>({
  windowSize: [1, 1],
  isSmall: true,
});
export default MediaContext;
