import React, {useEffect, useState, useMemo} from "react";
import MediaContext from "./mediaContext.ts";
import commonCss from "../components/commons.scss";
import {MediaContextType} from "./types/mediaType.ts";

/**
 * Device is small if 1px <= device width <= (maxSmallSize)px.
 */
const maxSmallSize = Number(commonCss.smallSize.slice(0, -2));

const MediaProvider = ({
  children,
}: {
  children: React.JSX.Element | React.JSX.Element[];
}) => {
  // The device is small.
  const [windowSize, setWindowSize] = useState<[number, number]>(() => {
    const body = document.body;
    return [body.clientHeight, body.clientWidth];
  });

  const context = useMemo<MediaContextType>(() => {
    const isSmall = windowSize[1] <= maxSmallSize;
    const headerHeight = Number( // Get var(--headerHeight) in css.
        getComputedStyle(document.documentElement)
            .getPropertyValue("--headerHeight")
            .slice(0, -2),
    );
    return {
      windowSize,
      headerHeight,
      isSmall,
      pos: isSmall ? "top" : "left",
      clientPos: isSmall ? "clientY" : "clientX",
      bound: isSmall ? [headerHeight, windowSize[0]] : [0, windowSize[1]],
    };
  }, [windowSize[0], windowSize[1]]);

  // Connect to window resize.
  useEffect(() => {
    const handleWindowResize = () => {
      const body = document.body;
      setWindowSize([body.clientHeight, body.clientWidth]);
    };
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  return (
    <MediaContext.Provider
      value={context}
    >
      {children}
    </MediaContext.Provider>
  );
};
export default MediaProvider;
