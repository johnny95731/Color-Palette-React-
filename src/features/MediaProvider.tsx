import React, { useEffect, useState, useMemo } from 'react';
import MediaContext from './mediaContext.ts';
import commonCss from '@/assets/commons.module.scss';
import { MediaContextType } from './types/mediaType.ts';

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
  const [windowSize, setWindowSize] = useState<[number, number]>(
    () => [window.innerHeight, window.innerWidth]
  );

  const context = useMemo<MediaContextType>(() => {
    const isSmall = windowSize[1] <= maxSmallSize;
    const headerHeight = Number( // Get var(--header-height) in css.
      getComputedStyle(document.documentElement)
        .getPropertyValue('--header-height')
        .slice(0, -2),
    );
    return {
      windowSize,
      headerHeight,
      isSmall,
      pos: isSmall ? 'top' : 'left',
      clientPos: isSmall ? 'clientY' : 'clientX',
      bound: isSmall ? [headerHeight, windowSize[0]] : [0, windowSize[1]],
    };
  }, [windowSize[0], windowSize[1]]);

  // Connect to window resize.
  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize([window.innerHeight, window.innerWidth]);
      // Mobile browser 100vh including toolbar.
      // window.innerHeight did not include toolbar.
      document.documentElement.style
        .setProperty('--app-height', `${window.innerHeight}px`);
    };
    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
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
