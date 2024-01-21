import React from "react";
import Icon, {type iconType} from "../Icons.tsx";
import TriangleUrl from "@/assets/icons/triangle-down.svg?url";
import css from "./menus.scss";
import {showPopupMenu} from "@/common/utils/helpers.ts";
import {MouseHandler, FocusHandler} from "types/eventHandler.ts";

export const Menu = ({
  children,
  className,
  iconType,
  title = "",
  contentClass = css.menuContent,
}: {
  children: React.ReactNode;
  className: string;
  iconType: iconType;
  title: string;
  contentClass?: string;
}): React.JSX.Element => {
  return (
    <span className={`${className ? className : ""} ${css.popupMenu}`}
      tabIndex={-1}
      onClick={showPopupMenu as MouseHandler}
      onBlur={showPopupMenu as FocusHandler}
    >
      <div className={css.menuTitle}>
        {iconType && <Icon type={iconType} />}
        {title}
        <img src={TriangleUrl} alt="clickable" className={css.triangle} />
      </div>
      <div className={contentClass}>
        {children}
      </div>
    </span>
  );
};
