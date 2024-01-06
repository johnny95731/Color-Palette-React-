import React, {useContext, useEffect, useMemo, useRef} from "react";
import Icon from "../Icons.tsx";
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

const Sort = ({
  sortBy,
  handleSorting,
}: {
  sortBy: SortActionType,
  handleSorting: (sortBy: SortActionType) => void
}) => {
  return (
    <Menu className={css.btn}
      iconType={"sort"}
      title="Sort"
    >
      {
        sortAction.map((val) => (
          <div key={`sortBy${val}`}
            style={{
              fontWeight: val === sortBy ? "800" : "",
            }}
            onClick={() => handleSorting(val)}
          >
            {`${val}${
              ["gray", "random"].includes(val) && ` (${val.slice(0, 1)})`
            }`}
          </div>
        ))
      }
    </Menu>
  );
};

const Blend = ({
  mixingMode,
  optionChanged,
}: {
  mixingMode: BlendingType,
  optionChanged: (newMode: BlendingType) => void
}) => {
  return (
    <Menu className={css.btn}
      iconType={"blend"}
      title={"Blend"}
    >
      {
        BlendModeList.map((val, i) => {
          return (
            <div key={`BlendBy${i}`}
              style={{
                fontWeight: val === mixingMode ? "800" : "",
              }}
              onClick={() => optionChanged(val)}
            >
              {val}
            </div>
          );
        })
      }
    </Menu>
  );
};

const Space = ({
  editingMode,
  optionChanged,
}: {
  editingMode: ColorSpacesType
  optionChanged: (newMode: ColorSpacesType) => void;
}) => {
  return (
    <Menu className={css.btn}
      iconType={"edit"}
      title={"Space"}
    >
      {
        ColorSpacesList.map((val, i) => {
          return (
            <div key={`Space${i}`}
              style={{
                fontWeight: val === editingMode ? "800" : "",
              }}
              onClick={() => optionChanged(val)}
            >
              {`${val.toUpperCase()}`}
            </div>
          );
        })
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
  const {mixingMode, editingMode} = useAppSelector(selectOptions);
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
    if (isSmall) {
      menuRef.current?.classList.add(menuCss.popupMenu);
      menuContentRef.current?.classList.add(menuCss.mobileMenuContent);
      menuContentRef.current?.classList.add(menuCss.menuContentR);
    } else {
      menuRef.current?.classList.remove(menuCss.popupMenu);
      if (menuContentRef.current) {
        menuContentRef.current.classList.remove(menuCss.mobileMenuContent);
        menuContentRef.current.classList.remove(menuCss.menuContentR);
        menuContentRef.current.style.display = "";
      }
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
          <Sort sortBy={sortBy} handleSorting={handleSorting} />
          <Blend mixingMode={mixingMode} optionChanged={handleBlendChanged} />
          <Space
            editingMode={editingMode} optionChanged={handleEditModeChanged}
          />
          {/* Float right */}
          <Bookmarks onClick={favShowingChanged} />
        </div>
      </div>
    </header>
  );
};
export default Header;
