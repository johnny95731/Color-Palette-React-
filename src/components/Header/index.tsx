import { useContext, useEffect, useMemo, useRef } from 'react';
import Icon from '../Customs/Icons.tsx';
import Menu from '../Customs/Menu.tsx';
import css from './index.module.scss';
// Utils / Consts
import { capitalize } from 'utils/helpers.ts';
import { preventDefault } from 'utils/eventHandler.ts';
import {
  COLOR_SPACES, BLEND_MODES, SORTING_ACTIONS, CURRENT_OPTION_WEIGHT,
} from 'utils/constants';
// Stores
import {
  useAppDispatch, useAppSelector, selectPlt, selectSettings,
} from '@/features';
import {
  setColorSpace, setBlendMode, refreshCard, setIsPending,
} from 'slices/pltSlice';
import MediaContext from '@/features/mediaContext.ts';
// types
import type { IconType } from '../Customs/Icons.tsx';
import type {
  SortActionType, ColorSpacesType, BlendingType,
} from 'types/pltType';

// Other components
const SettingMenu = ({
  iconType,
  title,
  contents,
  currentVal,
  letterCase = 'title',
  hotkeys = [],
  handleClick,
}: {
  iconType: IconType;
  title?: string;
  contents: readonly string[];
  currentVal: typeof contents[number];
  letterCase?: 'origin' | 'title' | 'all-caps';
  hotkeys?: Array<string | undefined>;
  handleClick: (option: typeof contents[number]) => void
}) => {
  const menuItems = useMemo(() => {
    /**
     * Convert leter case.
     */
    let converter = (x: string) => x; // origin
    if (letterCase === 'all-caps') {
      converter = (str: string) => str.toUpperCase();
    } else if (letterCase === 'title') converter = capitalize;
    return Array.from(contents, (val) => ({
      val,
      name: converter(val),
      style: val === currentVal ? CURRENT_OPTION_WEIGHT : undefined,
    }));
  }, [currentVal, letterCase, contents]);
  return (
    <Menu
      className={css.btnMenu}
      iconType={iconType}
      title={
        title ? title : `${iconType[0].toUpperCase()}${iconType.slice(1)}`
      }
    >
      {
        menuItems.map((item, i) => (
          <li key={`${iconType}${item.name}`}
            style={item.style}
            onClick={() => handleClick(item.val)}
          >
            {`${item.name}${
              hotkeys[i] ? ` (${hotkeys[i]})` : ''
            }`}
          </li>
        ))
      }
    </Menu>
  );
};

const Slides = () => {
  const dispatch = useAppDispatch();
  const { transition: { color } } = useAppSelector(selectSettings);

  const isRunning = useRef<boolean>(false);
  const intervalId = useRef<number | null>(null);
  const intervalPlay = () => {
    intervalId.current = window.setInterval(() => {
      isRunning.current && dispatch(refreshCard(-1));
    }, Math.max(color, 1000));
  };
  const handleClick = () => {
    if (isRunning.current) {
      if (intervalId.current !== null) window.clearInterval(intervalId.current);
      intervalId.current = null;
    } else {
      intervalPlay();
      dispatch(refreshCard(-1));
    }
    isRunning.current = !isRunning.current;
    dispatch(setIsPending(isRunning.current));
  };
  useEffect(() => {
    if (!isRunning.current) return;
    if (intervalId.current !== null) window.clearInterval(intervalId.current);
    intervalPlay();
  }, [color]);

  return (
    <button
      className={css.btn}
      onClick={handleClick}
    >
      <Icon type={isRunning.current ? 'pause' : 'play'} />
      Slides
    </button>
  );
};

const Btns = ({
  refreshPlt,
  sortPlt,
  showSettings,
  showFavOffcanvas,
}: {
  refreshPlt: () => void;
  sortPlt: (sortBy: SortActionType) => void;
  showSettings: () => void;
  showFavOffcanvas: () => void;
}) => {
  // Consts
  const { sortBy, blendMode, colorSpace } = useAppSelector(selectPlt);
  const dispatch = useAppDispatch();

  // Events
  const {
    handleMixingModeChanged: handleBlendChanged, handleEditModeChanged,
  } = useMemo(() => {
    return {
      handleMixingModeChanged(
        newMode: BlendingType,
      ) {
        dispatch(setBlendMode(newMode));
      },
      handleEditModeChanged(
        newMode: ColorSpacesType,
      ) {
        dispatch(setColorSpace(newMode));
      },
    };
  }, []);
  return (
    <>
      {/* Float left */}
      <li>
        <button
          className={css.btn}
          type='button'
          onClick={refreshPlt}
        >
          <Icon type="refresh" />
          All
        </button>
      </li>
      <li>
        <SettingMenu iconType="sort"
          contents={SORTING_ACTIONS} currentVal={sortBy}
          hotkeys={SORTING_ACTIONS.map((str) => str[0])}
          handleClick={sortPlt as (option: string) => void}
        />
      </li>
      <li>
        <SettingMenu
          iconType="blend"
          contents={BLEND_MODES}
          currentVal={blendMode}
          handleClick={handleBlendChanged as (option: string) => void}
        />
      </li>
      <li>
        <SettingMenu
          iconType="edit"
          title="Space"
          contents={COLOR_SPACES}
          currentVal={colorSpace}
          handleClick={handleEditModeChanged as (option: string) => void}
          letterCase="all-caps"
        />
      </li>
      <li>
        <Slides />
      </li>
      <div className='spacer' />
      {/* Float right */}
      <li>
        <button
          className={css.btn}
          type='button'
          onClick={showFavOffcanvas}
        >
          <Icon type="bookmark" />
          Bookmarks
        </button>
      </li>
      <li>
        <button
          type='button'
          className={css.btn}
          onClick={showSettings}
        >
          <Icon type="setting" />
          Settings
        </button>
      </li>
    </>
  );
};

// Main component
const Header = ({
  refreshPlt,
  sortPlt,
  showSettings,
  showFavOffcanvas,
}: {
  refreshPlt: () => void;
  sortPlt: (sortBy: SortActionType) => void;
  showSettings: () => void;
  showFavOffcanvas: () => void;
}) => {
  // Consts
  const headerRef = useRef<HTMLElement>(null);
  const { isSmall } = useContext(MediaContext);

  useEffect(() => {
    headerRef.current?.addEventListener('contextmenu', preventDefault);
    return () => headerRef.current?.removeEventListener('contextmenu', preventDefault);
  }, []);

  return (
    <header
      ref={headerRef}
      className={css.header} 
    >
      <h1 className={css.title}>
        Color Palette
      </h1>
      {
        !isSmall ?
          <div className={css.menuWrapper}>
            <menu className={css.menubar}>
              <Btns
                refreshPlt={refreshPlt}
                sortPlt={sortPlt}
                showSettings={showSettings}
                showFavOffcanvas={showFavOffcanvas}
              />
            </menu>
          </div> :
          <>
            <div className='spacer' />
            <Menu
              className={css.menuWrapper}
              titleClass={css.menubarTitle}
              contentClass={css.menubar}
              iconType='list'
              isMobile={true}
              showTriangle={false}
            >
              <Btns
                refreshPlt={refreshPlt}
                sortPlt={sortPlt}
                showSettings={showSettings}
                showFavOffcanvas={showFavOffcanvas}
              />
            </Menu>
          </>
      }
    </header>
  );
};
export default Header;
