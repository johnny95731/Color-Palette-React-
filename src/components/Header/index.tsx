import React, {useContext, useEffect, useMemo, useRef} from "react";
import Icon, {iconType} from "../Icons.tsx";
import {Menu, showPopupMenu} from "./Menus.tsx";
import css from "./index.scss";
import menuCss from "./menus.scss";
// Redux / Context
import {useAppDispatch, useAppSelector} from "../../common/hooks/storeHooks.ts";
import {
  editModeChanged, mixingModeChanged,
} from "../../features/slices/optionsSlice.ts";
import MediaContext from "../../features/mediaContext.ts";
import {selectCard, selectOptions} from "../../features/store.ts";
// types
import {MouseHandler} from "../../common/types/eventHandler.ts";
import {sortAction, SortActionType} from "../../features/types/cardType.ts";
import {
  ColorSpacesList, ColorSpacesType, BlendModeList, BlendingType,
} from "../../features/types/optionsType.ts";

const preventDefault = (e: MouseEvent) => {
  e.preventDefault();
  return false;
};

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
  hotkeys = [],
  handleClick,
}: {
  iconType: iconType;
  title?: string;
  contents: readonly string[];
  currentVal: typeof contents[number];
  hotkeys?: Array<string | undefined>;
  handleClick: (option: typeof contents[number]) => void
}) => {
  return (
    <Menu className={css.btn}
      iconType={iconType}
      title={
        title ? title : `${iconType[0].toUpperCase()}${iconType.slice(1)}`
      }
    >
      {
        contents.map((val, i) => (
          <div key={`${iconType}${val}`}
            style={{
              fontWeight: val === currentVal ? "800" : "",
            }}
            onClick={() => handleClick(val)}
          >
            {`${val}${
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
      <Icon type={"bookmark"} />
      Bookmarks
    </span>
  );
};

// Main component
const Header = ({
  refresh,
  handleSorting,
  favShowingChanged,
}: {
  refresh: () => void;
  handleSorting: (sortBy: SortActionType) => void;
  favShowingChanged: () => void;
}) => {
  // Consts
  const menuRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);
  const {isSmall} = useContext(MediaContext);
  const {sortBy} = useAppSelector(selectCard);
  const {blendMode, colorSpace} = useAppSelector(selectOptions);
  const dispatch = useAppDispatch();

  // Events
  const {
    handleMixingModeChanged: handleBlendChanged, handleEditModeChanged,
  } = useMemo(() => {
    return {
      handleMixingModeChanged: (
          newMode: BlendingType,
      ) => {
        dispatch(mixingModeChanged(newMode));
      },
      handleEditModeChanged: (
          newMode: ColorSpacesType,
      ) => {
        dispatch(editModeChanged(newMode));
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
          <Icon type={"list"} />
        }
        <div ref={menuContentRef}>
          {/* Float left */}
          <RefreshAll onClick={refresh} />
          <SettingMenu iconType="sort"
            contents={sortAction} currentVal={sortBy}
            hotkeys={sortAction.map((str) => str[0])}
            handleClick={handleSorting as (option: string) => void}
          />
          <SettingMenu iconType="blend"
            contents={BlendModeList} currentVal={blendMode}
            handleClick={handleBlendChanged as (option: string) => void}
          />
          <SettingMenu iconType="edit" title="Space"
            contents={ColorSpacesList} currentVal={colorSpace}
            handleClick={handleEditModeChanged as (option: string) => void}
          />
          {/* Float right */}
          <Bookmarks onClick={favShowingChanged} />
        </div>
      </div>
    </header>
  );
};
export default Header;
