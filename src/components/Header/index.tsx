import React, {useContext, useEffect, useMemo, useRef} from "react";
import Icon from "../Icons";
import {Menu, showPopupMenu} from "./Menus";
import css from "./index.scss";
import menuCss from "./menus.scss";
// Utils / Consts
import {capitalize, preventDefault} from "@/common/utils/helpers.ts";
import {sortAction} from "@/features/types/cardType.ts";
import {ColorSpacesList, BlendModeList} from "@/features/types/optionsType.ts";
// Stores
import {selectCard, selectOptions} from "@/features/store.ts";
import {useAppDispatch, useAppSelector} from "@/common/hooks/storeHooks.ts";
import {editModeChanged, mixingModeChanged} from "slices/optionsSlice.ts";
import MediaContext from "@/features/mediaContext.ts";
// types
import type {iconType} from "../Icons";
import type {MouseHandler} from "@/common/types/eventHandler.ts";
import type {SortActionType} from "@/features/types/cardType.ts";
import type {ColorSpacesType, BlendingType} from "types/optionsType.ts";

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
      style: val === currentVal ? {fontWeight: "800"}: undefined,
    }));
  }, [currentVal, letterCase, contents]);
  return (
    <Menu className={css.btn}
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
