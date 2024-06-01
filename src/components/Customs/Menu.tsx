import React from 'react';
import Icon from './Icons.tsx';
import TriangleUrl from '@/assets/icons/triangle-down.svg?url';
import styles from './menu.module.scss';
// Utils
import { showPopupMenu } from '@/common/utils/helpers.ts';
// Types
import type { MouseHandler, FocusHandler } from 'types/eventHandler.ts';
import type { IconType } from './Icons.tsx';

const Menu = ({
  children,
  className,
  iconType,
  title = '',
  contentClass = styles.menuContent,
}: {
  children: React.ReactNode;
  className?: string;
  iconType?: IconType;
  title?: string;
  contentClass?: string;
}): React.JSX.Element => {
  return (
    <span className={`${className ? className : ''} ${styles.popupMenu}`}
      tabIndex={-1}
      onClick={showPopupMenu as MouseHandler}
      onBlur={showPopupMenu as FocusHandler}
    >
      <div className={styles.menuTitle}>
        {iconType && <Icon type={iconType} />}
        {title}
        <img src={TriangleUrl} alt="clickable" className={styles.triangle} />
      </div>
      <ul className={contentClass}>
        {children}
      </ul>
    </span>
  );
};
export default Menu;
