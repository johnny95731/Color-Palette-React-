import React, {useContext, useEffect, useMemo, useRef} from "react";
import Icon from "../Icons.tsx";
import {Menu, showPopupMenu} from "./Menus.tsx";
import css from "./index.scss";
import menuCss from "./menus.scss";
// Redux / Context
import {useAppDispatch} from "../../common/hooks/storeHooks.ts";
import {
  editModeChanged, mixingModeChanged,
} from "../../features/slices/optionsSlice.ts";
import MediaContext from "../../features/mediaContext.ts";
// types
import {MouseHandler} from "../../common/types/eventHandler.ts";
import {sortAction, SortActionType} from "../../features/types/cardType.ts";
import {
  ColorSpacesList, ColorSpacesType, MixingModeList, MixingModeType,
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
  handleSorting,
}: {
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
            // onTouchStart={isSmall ? () => handleSorting(val) : undefined}
            // onClick={isSmall ? undefined : () => handleSorting(val)}
            onClick={() => handleSorting(val)}
          >
            {`${val}${
              ["gray", "random"].includes(val) ? ` (${val.slice(0, 1)})` : ""
            }`}
          </div>
        ))
      }
    </Menu>
  );
};

const Blend = ({
  optionChanged,
}: {
  isSmall?: boolean,
  optionChanged: (newMode: MixingModeType) => void
}) => {
  return (
    <Menu className={css.btn}
      iconType={"blend"}
      title={"Blend"}
    >
      {
        MixingModeList.map((val, i) => {
          return (
            <div key={`mode${i}`}
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

const Edit = ({
  optionChanged,
}: {
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
            <div key={`mode${i}`}
              onClick={() => optionChanged(val)}
            >
              {val.toUpperCase()}
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
  const dispatch = useAppDispatch();

  // Events
  const {
    handleMixingModeChanged: handleBlendChanged, handleEditModeChanged,
  } = useMemo(() => {
    return {
      handleMixingModeChanged: (
          newMode: MixingModeType,
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
          <Sort handleSorting={handleSorting} />
          <Blend optionChanged={handleBlendChanged} />
          <Edit optionChanged={handleEditModeChanged} />
          {/* Float right */}
          <Bookmarks onClick={favShowingChanged} />
        </div>
      </div>
    </header>
  );
};
export default Header;
