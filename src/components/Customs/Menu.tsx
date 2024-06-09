import React, { useCallback, useMemo, useRef, useState } from 'react';
import Icon from './Icons.tsx';
import TriangleUrl from '@/assets/icons/triangle-down.svg?url';
import css from './menu.module.scss';
import type { IconType } from './Icons.tsx';
import { toClass } from '@/common/utils/helpers.ts';

const Menu = ({
  children,
  isMobile = false,
  className,
  iconType,
  title,
  titleClass,
  contentClass,
  showTriangle = true,
}: {
  tag?: string;
  isMobile?: boolean;
  children: React.ReactNode;
  className?: string;
  iconType?: IconType;
  title?: string;
  titleClass?: string;
  contentClass?: string;
  showTriangle?: boolean;
}): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isOpened, setIsOpened] = useState(() => false);
  const handleBtnClick = useCallback((e: React.MouseEvent | React.FocusEvent, newVal?: boolean) => {
    if ( // Avoid closing menu when click child.
      e?.type === 'blur' &&
      // `e.relatedTarget !== null` can not deal the case that click another
      // foucusable element.
      e.currentTarget.contains(e.relatedTarget as Element | null)
    ) return;
    const container = containerRef.current as HTMLDivElement;
    const content = contentRef.current as HTMLDivElement;
    if (e?.type === 'click' && !content.contains(e.target as Node)) {
      e.stopPropagation();
    }
    setIsOpened(prev => {
      newVal = newVal ?? !prev;
      const rect = container.getBoundingClientRect();
      const height = (
        newVal ?
          `${document.body.clientHeight - rect.bottom}px` : // open
          '' // close
      );
      content.style.maxHeight = height;
      (content.lastChild as HTMLElement).style.maxHeight = height;
      if (!newVal) {
        (container.firstChild as HTMLElement).blur();
      }
      return newVal;
    });
  }, []);

  const handleContentChanged = () => { // called after transition end.
    if (isMobile) return;
    const content = contentRef.current as HTMLDivElement;
    if (!content) return;
    const menu = content.lastElementChild as HTMLMenuElement;
    const rect = content.getBoundingClientRect();
    const height = isOpened ? `${rect.height}px` : '';
    content.style.maxHeight = height;
    menu.style.height = height;
    menu.style.maxHeight = height;
  };

  const containerClass_ = useMemo(() =>(
    toClass([css.dropdownMenu, isOpened && css.active, className])
  ), [className, isOpened]);
  const titleClass_ = useMemo(() =>(
    toClass([css.menuTitle, titleClass])
  ), [titleClass]);
  const contentClass_ = useMemo(() =>(
    toClass([
      isMobile ? css.mobileContentWrapper : css.contentWrapper,
      contentClass,
    ])
  ), [contentClass, isMobile]);
  
  return (
    <div
      ref={containerRef}
      className={containerClass_}
      tabIndex={-1}
      onClick={handleBtnClick}
      onBlur={(e) => handleBtnClick(e, false)}
    >
      <button
        className={titleClass_}
        type='button'
        aria-haspopup="menu"
        aria-expanded={isOpened || undefined}
      >
        <div>
          {iconType && <Icon type={iconType} />}
          {title}
        </div>
        {
          showTriangle &&
          <img src={TriangleUrl} alt="clickable" className={css.triangle} />
        }
      </button>
      <div
        ref={contentRef}
        className={contentClass_}
        onTransitionEnd={handleContentChanged}
      >
        <menu className={css.menuContent}>
          {children}
        </menu>
      </div>
    </div>
  );
};
export default Menu;
