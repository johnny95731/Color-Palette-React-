import React, {useContext, useEffect, useMemo, useRef} from "react";
import Icon from "../Customs/Icons.tsx";
import Menu from "../Customs/Menu.tsx";
import css from "./index.scss";
import menuCss from "../Customs/menu.scss";
// Utils / Consts
import {
  capitalize, preventDefault, showPopupMenu,
} from "@/common/utils/helpers.ts";
import {
  COLOR_SPACES, BLEND_MODES, SORTING_ACTIONS,
  CURRENT_OPTION_WEIGHT,
} from "@/common/utils/constants";
// Stores
import {
  useAppDispatch, useAppSelector, selectPlt,
} from "@/features";
import {setColorSpace, setBlendMode} from "slices/pltSlice";
import MediaContext from "@/features/mediaContext.ts";
// types
import type {iconType} from "../Customs/Icons.tsx";
import type {MouseHandler} from "types/eventHandler.ts";
import type {
  SortActionType, ColorSpacesType, BlendingType,
} from "types/pltType";

// Other components
const RefreshAll = ({
  onClick: haldleClick,
}: {
  onClick: () => void;
}) => {
  return (
    <span className={css.btn} onClick={haldleClick}>
      <Icon type="refresh" />
      All
    </span>
  );
};

const SettingMenu = ({
  iconType,
  title,
  contents,
  currentVal,
  letterCase = "title",
  hotkeys = [],
  handleClick,
}: {
  iconType: iconType;
  title?: string;
  contents: readonly string[];
  currentVal: typeof contents[number];
  letterCase?: "origin" | "title" | "all-caps";
  hotkeys?: Array<string | undefined>;
  handleClick: (option: typeof contents[number]) => void
}) => {
  const menuItems = useMemo(() => {
    /**
     * Convert leter case.
     */
    let converter = (x: string) => x; // origin
    if (letterCase === "all-caps") {
      converter = (str: string) => str.toUpperCase();
    } else if (letterCase === "title") converter = capitalize;
    return Array.from(contents, (val) => ({
      val,
      name: converter(val),
      style: val === currentVal ? CURRENT_OPTION_WEIGHT : undefined,
    }));
  }, [currentVal, letterCase, contents]);
  return (
    <Menu className={css.btnMenu}
      iconType={iconType}
      title={
        title ? title : `${iconType[0].toUpperCase()}${iconType.slice(1)}`
      }
    >
      {
        menuItems.map((item, i) => (
          <div key={`${iconType}${item.name}`}
            style={item.style}
            onClick={() => handleClick(item.val)}
          >
            {`${item.name}${
              hotkeys[i] ? ` (${hotkeys[i]})` : ""
            }`}
          </div>
        ))
      }
    </Menu>
  );
};

const Bookmarks = ({
  isSmall,
  onClick,
}: {
  isSmall?: boolean,
  onClick: () => void;
}) => {
  return (
    <span className={`${css.btn} ${isSmall ? "" : css.btnR}`}
      onClick={onClick}
    >
      <Icon type="bookmark" />
      Bookmarks
    </span>
  );
};

const Settings = ({
  isSmall,
  onClick,
}: {
  isSmall?: boolean,
  onClick: (e: React.MouseEvent) => void;
}) => {
  return (
    <span className={`${css.btn} ${isSmall ? "" : css.btnR}`}
      onClick={onClick}
    >
      <Icon type="setting" />
      Settings
    </span>
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
  const menuRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);
  const {isSmall} = useContext(MediaContext);
  const {sortBy, blendMode, colorSpace} = useAppSelector(selectPlt);
  const dispatch = useAppDispatch();

  // Events
  const {
    handleMixingModeChanged: handleBlendChanged, handleEditModeChanged,
  } = useMemo(() => {
    return {
      handleMixingModeChanged: (
          newMode: BlendingType,
      ) => {
        dispatch(setBlendMode(newMode));
      },
      handleEditModeChanged: (
          newMode: ColorSpacesType,
      ) => {
        dispatch(setColorSpace(newMode));
      },
    };
  }, []);

  useEffect(() => {
    const content = menuContentRef.current as HTMLDivElement;
    if (isSmall) {
      menuRef.current?.classList.add(menuCss.popupMenu);
      content.classList.add(menuCss.mobileMenuContent);
      content.classList.add(menuCss.menuContentR);
    } else {
      menuRef.current?.classList.remove(menuCss.popupMenu);
      content.classList.remove(menuCss.mobileMenuContent);
      content.classList.remove(menuCss.menuContentR);
      content.style.display = "";
    }
  }, [isSmall]);

  useEffect(() => {
    menuRef.current?.addEventListener(
        "contextmenu", preventDefault,
    );
    return () => menuRef.current?.addEventListener(
        "contextmenu", preventDefault,
    );
  }, []);

  return (
    <header className={css.header}>
      <h1 className={css.title}>
        Color Palette
      </h1>
      <div className={css.menubar} ref={menuRef}
        onClick={isSmall ? (showPopupMenu as MouseHandler) : undefined}
      >
        {
          isSmall &&
          <Icon type="list" className={css.list} />
        }
        <div ref={menuContentRef}>
          {/* Float left */}
          <RefreshAll onClick={refreshPlt} />
          <SettingMenu iconType="sort"
            contents={SORTING_ACTIONS} currentVal={sortBy}
            hotkeys={SORTING_ACTIONS.map((str) => str[0])}
            handleClick={sortPlt as (option: string) => void}
          />
          <SettingMenu iconType="blend"
            contents={BLEND_MODES} currentVal={blendMode}
            handleClick={handleBlendChanged as (option: string) => void}
          />
          <SettingMenu iconType="edit" title="Space"
            contents={COLOR_SPACES} currentVal={colorSpace}
            handleClick={handleEditModeChanged as (option: string) => void}
            letterCase="all-caps"
          />
          <div className={css.empty}></div>
          {/* Float right */}
          <Bookmarks onClick={showFavOffcanvas} />
          <Settings onClick={showSettings} />
        </div>
      </div>
    </header>
  );
};
export default Header;
