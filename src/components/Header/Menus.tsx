import React from "react";
import Icon, {iconType} from "../Icons.tsx";
import css from "./menus.scss";
import TriangleUrl from "@/assets/icons/triangle-down.svg?url";
import {MouseHandler, FocusHandler} from "types/eventHandler.ts";


export const showPopupMenu: MouseHandler | FocusHandler = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
) => {
  const target = e.currentTarget;
  const content = target.lastChild as HTMLElement;
  if ((e as React.FocusEvent).type === "blur") {
    content.style.maxHeight = "";
    return;
  }
  /**
   * For small size device, menu has 2 layers. The outer mune content contains
   * menu (inner menu) and non-menu (button). And both layers' menu connet to
   * this function. Click outer menu content has following 3 cases.
   * 1. Click non-menu: target === (outer menu). Trigger button event and close
   *    outer content.
   * In case 2 and 3, target === (inner menu).
   * 2. Click inner menu: content === (inner menu content). Hence, stop
   *    propagation to outer menu and open inner menu content.
   * 3. Click inner menu content: (!content.contains(e.target) === false).
   *    Hence, do propagation => close outer menu content.
   */
  if (!content.contains(e.target as Node)) {
    e.stopPropagation();
  }
  const height = content.style.maxHeight;
  if (height === "") {
    content.style.maxHeight = "100vh";
  } else {
    content.style.maxHeight = "";
    target.blur();
  }
};

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
