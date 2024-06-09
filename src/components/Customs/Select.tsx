import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import TriangleUrl from '@/assets/icons/triangle-down.svg?url';
import css from './menu.module.scss';
import { CURRENT_OPTION_WEIGHT } from 'utils/constants';
import { toClass } from '@/common/utils/helpers';

type SelectProps = {
  isMobile?: boolean,
  className?: string;
  titleClass?: string;
  contentClass?: string;
  children?: React.JSX.Element | React.JSX.Element[];
  options: readonly string[];
  defaultValue?: string;
  value?: string;
  onSelect?: (val: string) => any;
}

export type SelectExposed = {
  /**
   * Ref of container
   */
  element: HTMLSpanElement,
  /**
   * Select item of index idx.
   */
  select: (idx: number) => void,
  /**
   * Return the style of selected list item if idx is selected.
   */
  liStyle: (idx: number) => React.CSSProperties | undefined,
}

const Select = React.memo(forwardRef<SelectExposed, SelectProps>(({
  isMobile,
  className,
  titleClass,
  contentClass,
  children,
  options,
  defaultValue,
  value,
  onSelect,
},
ref
): React.JSX.Element => {
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
    setIsOpened(prev => {
      newVal = newVal ?? !prev;
      const container = containerRef.current as HTMLDivElement;
      const rect = container.getBoundingClientRect();
      const content = contentRef.current as HTMLDivElement;
      content.style.maxHeight = (
        newVal ?
          `${document.body.clientHeight - rect.bottom}px` : // open
          '' // close
      );
      if (!newVal) {
        container.blur();
        (container.firstChild as HTMLElement).blur();
      }
      return newVal;
    });
  }, []);

  const handleContentChanged = () => { // called after transition end.
    const content = contentRef.current as HTMLDivElement;
    if (!content) return;
    const rect = content.getBoundingClientRect();
    const height = isOpened ? `${rect.height}px` : '';
    content.style.maxHeight = height;
    content.style.height = height;
  };

  // Selected state
  const [currentVal, setCurrentVal] = useState(
    () => defaultValue ? defaultValue : (value ? value : options[0]),
  );
  const currentIdx = useRef<number>(options.indexOf(currentVal));
  // Handle prop `value` changed.
  useEffect(() => {
    if (value && value !== currentVal && options.includes(value)) {
      options.indexOf(value);
      setCurrentVal(value);
    }
  }, [value]);

  const handleSelect = useCallback((idx: number) => {
    const newVal = options[idx];
    currentIdx.current = idx;
    setCurrentVal(newVal);
    if (onSelect) onSelect(newVal);
  }, [options, onSelect]);

  const liStyle = useCallback((idx: number) => 
    idx === currentIdx.current ? CURRENT_OPTION_WEIGHT : undefined,
  []);

  const containerClass_ = useMemo(() =>(
    toClass([css.selectMenu, className])
  ), [className]);
  const titleClass_ = useMemo(() =>(
    toClass([css.menuTitle, titleClass])
  ), [titleClass]);
  const contentClass_ = useMemo(() =>(
    toClass([
      isMobile ? css.mobileContentWrapper : css.contentWrapper,
      contentClass
    ])
  ), [contentClass]);

  // Expose data.
  useImperativeHandle(ref, () => {
    return {
      element: containerRef.current as HTMLSpanElement,
      select: handleSelect,
      liStyle,
    };
  }, [handleSelect]);

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
        <div>{currentVal}</div>
        <img src={TriangleUrl} alt="clickable" className={css.triangle} />
      </button>
      <div
        ref={contentRef}
        className={contentClass_}
        onTransitionEnd={handleContentChanged}
      >
        <menu
          className={css.menuContent}
        >
          {
            children ??
            options.map((val, i) => (
              <li key={`Option ${val}`}
                style={liStyle(i)}    
                onClick={() => handleSelect(i)}
              >
                {val}
              </li>
            ))
          }
        </menu>
      </div>
    </div>
  );
}));
export default Select;
