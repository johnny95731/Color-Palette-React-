import React, {useEffect, useMemo} from "react";
import Icon from "../Icons.jsx";
import css from "./index.scss";

import {Menu} from "../Menus/Menus.jsx";

const Header = ({
  refresh,
  sortCard,
  optionChanged,
  favoritingPlt,
  isFavPlt,
  favShowingChanged,
}) => {
  // Connect refresh event to `space` button.
  useEffect(() => {
    const body = document.body;
    const refreshEvent = (e) => {
      if (e.key === " ") refresh();
      else if (e.key.toLowerCase() === "g") sortCard("gray");
      else if (e.key.toLowerCase() === "r") sortCard("random");
    };
    body.addEventListener("keypress", refreshEvent);
    return () => body.removeEventListener("keypress", refreshEvent);
  }, []);

  return (
    <header className={css.header}>
      <h1 className={css.title}>
        Color Palette
      </h1>
      <div className={css.menubar}>
        {/* Left */}
        <RefreshAll onClick={refresh} />
        <Sort sortCard={sortCard} />
        <Insert optionChanged={optionChanged} />
        <Edit optionChanged={optionChanged} />
        {/* Right */}
        {/* <Setting /> */}
        <Bookmarks onClick={favShowingChanged} />
        <FavorPallete isFavPlt={isFavPlt} onClick={favoritingPlt} />
      </div>
    </header>
  );
};
export default Header;


// Other components
const RefreshAll = ({onClick}) => {
  return (
    <span className={css.btn} onClick={onClick}>
      <Icon type="refresh" />
      All
    </span>
  );
};

const Sort = ({sortCard}) => {
  return (
    <Menu className={css.btn}
      iconType={"sort"}
      title="Sort"
      type="popup"
    >
      <div onClick={() => sortCard("gray")}>Gray (g)</div>
      <div onClick={() => sortCard("random")}>Random (r)</div>
      <div onClick={() => sortCard("invert")}>Invert</div>
    </Menu>
  );
};

const Insert = ({optionChanged}) => {
  return (
    <Menu className={css.btn}
      iconType={"insert"}
      title={"Insert"}
    >
      {
        ["RGB Mean", "Random"].map((val, i) => {
          return (
            <div key={`mode${i}`}
              onClick={() => optionChanged("insert", i)}
            >
              {val}
            </div>
          );
        })
      }
    </Menu>
  );
};

const Edit = ({optionChanged}) => {
  return (
    <Menu className={css.btn}
      iconType={"edit"}
      title={"Edit"}
    >
      {
        ["RGB", "HSB", "HSL", "CMY"].map((val, i) => {
          return (
            <div key={`mode${i}`}
              onClick={() => optionChanged("mode", val.toLowerCase())}
            >
              {val}
            </div>
          );
        })
      }
    </Menu>
  );
};

const FavorPallete = ({isFavPlt, onClick}) => {
  const state = useMemo(() => {
    if (isFavPlt) {
      return {
        icon: "UnfavorPallete",
        text: "Del",
      };
    } else {
      return {
        icon: "FavorPallete",
        text: "Add",
      };
    }
  }, [isFavPlt]);
  return (
    <span className={`${css.btn} ${css.btnR}`}
      onClick={onClick}
      style={{width: "55px"}}
    >
      <Icon type={state.icon} />
      {state.text}
    </span>
  );
};

const Bookmarks = ({onClick}) => {
  return (
    <span className={`${css.btn} ${css.btnR}`}
      onClick={onClick}
    >
      <Icon type={"bookmark"} />
      Bookmarks
    </span>
  );
};

// const Setting = ({optionChanged}) => {
//   return (
//     <span className={`${css.btn} ${css.btnR}`}>
//       <Icon type={"gear"} />
//       Setting
//     </span>
//   );
// };
