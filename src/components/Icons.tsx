import React, {useRef, useEffect, useMemo} from "react";
import "./icons.scss";

import CloseUrl from "../../res/img/x-lg.svg?url";
import DelUrl from "../../res/img/trash3-fill.svg?url";
import LockUrl from "../../res/img/lock-fill.svg?url";
import UnlockUrl from "../../res/img/unlock-fill.svg?url";
import FavUrl from "../../res/img/star-fill.svg?url";
import UnfavUrl from "../../res/img/star.svg?url";
import DrapUrl from "../../res/img/arrows.svg?url";
import RefreshUrl from "../../res/img/arrow-clockwise.svg?url";
import SliderUrl from "../../res/img/sliders.svg?url";
import CopyUrl from "../../res/img/copy.svg?url";
import SortUrl from "../../res/img/sort-down.svg?url";
import InsertUrl from "../../res/img/file-earmark-plus.svg?url";
import AppendtUrl from "../../res/img/arrows-expand-vertical.svg?url";
import FavPalleteUrl from "../../res/img/bookmark-plus.svg?url";
import UnfavPalleteUrl from "../../res/img/bookmark-dash.svg?url";
import BookmarkUrl from "../../res/img/bookmarks.svg?url";
import GearUrl from "../../res/img/gear.svg?url";

interface EventCallback {
  (e: any): void | boolean
}

const urls: {[key: string]: string;} = {
  close: CloseUrl,
  del: DelUrl,
  lock: LockUrl,
  unlock: UnlockUrl,
  fav: FavUrl,
  unfav: UnfavUrl,
  move: DrapUrl,
  refresh: RefreshUrl,
  edit: SliderUrl,
  copy: CopyUrl,
  sort: SortUrl,
  mixing: InsertUrl,
  insertRight: AppendtUrl,
  insertLeft: AppendtUrl,
  FavorPallete: FavPalleteUrl,
  UnfavorPallete: UnfavPalleteUrl,
  bookmark: BookmarkUrl,
  gear: GearUrl,
} as const;

const Icon = ({
  type,
  className,
  style,
  events = [],
}: {
  type: string;
  className?: string;
  style?: object;
  events?: Array<[string, EventCallback]>;
}): React.JSX.Element => {
  const imgRef = useRef<HTMLImageElement>(null);
  const _className = useMemo(() => (
    `icon ${typeof className === "string" ? className : ""}`
  ), [className]);

  // Connect events
  useEffect(() => {
    const element = imgRef.current as HTMLImageElement;
    events.forEach((ev) => {
      element.addEventListener(...ev);
    });
    return () => {
      events.forEach((ev) => {
        element.removeEventListener(...ev);
      });
    };
  }, []);

  return (
    <img src={urls[type]} alt={type} ref={imgRef}
      className={_className}
      style={style}
      draggable="false"
    />
  );
};
export default Icon;
