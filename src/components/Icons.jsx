import React, {useRef, useEffect, useMemo} from "react";
import "./icons.scss";

import CloseUrl from "../images/x-lg.svg?url";
import DelUrl from "../images/trash3-fill.svg?url";
import LockUrl from "../images/lock-fill.svg?url";
import UnlockUrl from "../images/unlock-fill.svg?url";
import FavUrl from "../images/star-fill.svg?url";
import UnfavUrl from "../images/star.svg?url";
import RefreshUrl from "../images/arrow-clockwise.svg?url";
import SliderUrl from "../images/sliders.svg?url";
import CopyUrl from "../images/copy.svg?url";
import SortUrl from "../images/sort-down.svg?url";
import InsertUrl from "../images/file-earmark-plus.svg?url";
import insertRightUrl from "../images/arrow-bar-left.svg?url";
import insertLeftUrl from "../images/arrow-bar-right.svg?url";
import FavPalleteUrl from "../images/file-earmark-plus.svg?url";
import BookmarkUrl from "../images/bookmarks.svg?url";
import GearUrl from "../images/gear.svg?url";


const urls = {
  close: CloseUrl,
  del: DelUrl,
  lock: LockUrl,
  unlock: UnlockUrl,
  fav: FavUrl,
  unfav: UnfavUrl,
  refresh: RefreshUrl,
  edit: SliderUrl,
  copy: CopyUrl,
  sort: SortUrl,
  insert: InsertUrl,
  insertRight: insertRightUrl,
  insertLeft: insertLeftUrl,
  FavorPallete: FavPalleteUrl,
  bookmark: BookmarkUrl,
  gear: GearUrl,
};

const Icon = ({
  type,
  className,
  style,
  events = [],
}) => {
  const domRef = useRef();
  const _className = useMemo(() => (
    `icon ${typeof className === "string" ? className : ""}`
  ), [className]);

  // Connect events
  useEffect(() => {
    const element = domRef.current;
    events.forEach((ev) => {
      element.addEventListener(...ev);
    });
    return () => {
      events.forEach((ev, i) => {
        element.removeEventListener(...ev);
      });
    };
  }, []);
  return (
    <img src={urls[type]} alt={type} ref={domRef}
      className={_className}
      style={style}
    />
  );
};
export default Icon;
