import React, {useEffect, useState, useRef, useCallback, useMemo} from "react";
import css from "./slider.scss";
import {toPercent, clip, round} from "@/common/utils/helpers";

const Slider = ({
  min = 0,
  max = 100,
  defaultValue,
  value,
  digit = 3,
  step,
  showRange = true,
  onChange,
}: {
  min?: number;
  max?: number;
  defaultValue?: number;
  value?: number;
  digit?: number;
  step?: number;
  showRange?: boolean;
  onChange?: (val: number) => void;
}) => {
  const trackerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(() => false);
  /**
   * Lenth of range.
   */
  const range = useMemo(() => max - min, [min, max]);
  const [currentVal, setCurrentVal] = useState<number>(() => {
    const val = defaultValue ?
        defaultValue :
        (value ? value : (max + min) / 2);
    return clip(val, min, max);
  });
  /**
   * Left position of indicator.
   */
  const pos = `${toPercent((currentVal - min) / range, 2)}%`;
  // Handle prop `value` changed
  useEffect(() => {
    if (value === undefined) return;
    const val = round(clip(value, min, max), digit);
    if (val === currentVal) return;
    setCurrentVal(val);
    if (onChange) onChange(val);
  }, [value, min, max]);
  // Step increment function. If num < 0, then becomes decrement.
  const increment = useMemo(() => {
    const unitVal = step ? step : 10**(-digit);
    const increment = (num: number = 1) => {
      setCurrentVal((prev) =>(
        round(
            clip(prev + num * unitVal, min, max),
            digit,
        )
      ));
    };
    return increment;
  }, [step, digit, min, max]);

  // onChange event => Drag or key down.
  // -Mouse down / Touch start.
  // -Mouse move / Touch move.
  const handleDrag = useCallback((
      e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  ) => {
    if (!e.type.endsWith("move")) { // touch start / mouse down
      (e.currentTarget as HTMLDivElement).focus();
      if (tooltipRef.current === e.target) return; // Prevent draggint tooltip.
      setIsDragging(true);
    } else if (!isDragging) return;
    const rect = trackerRef.current?.getBoundingClientRect() as DOMRect;
    // Get cursor position.
    const clientX = e.type.startsWith("touch") ?
        (e as TouchEvent).touches[0].clientX :
        (e as MouseEvent).clientX;
    // Evaluate value.
    const percent = clip((clientX - rect.left) / rect.width, 0, 1) * range;
    let val: number;
    if (step) val = round(min + Math.floor(percent / step) * step, digit);
    else val = round(min + percent, digit);
    // Emit event.
    if (onChange) onChange(val);
    setCurrentVal(val);
  }, [isDragging, max, min, trackerRef.current]);

  // -Mouse up / Touch end.
  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    const body = document.body;
    body.addEventListener("mousemove", handleDrag);
    body.addEventListener("touchmove", handleDrag);
    return () => {
      body.removeEventListener("mousemove", handleDrag);
      body.removeEventListener("touchmove", handleDrag);
    };
  }, [handleDrag]);
  useEffect(() => {
    const body = document.body;
    body.addEventListener("mouseup", handleDragEnd);
    body.addEventListener("touchend", handleDragEnd);
    return () => {
      body.removeEventListener("mouseup", handleDragEnd);
      body.removeEventListener("touchend", handleDragEnd);
    };
  }, []);
  // -Key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") increment(-1);
    else if (e.key == "ArrowRight") increment();
  };
  // end: onChange event

  return (
    <div className={css.sliderWrapper}>
      <div className={css.tracker} ref={trackerRef} tabIndex={-1}
        onMouseDown={handleDrag}
        onTouchStart={handleDrag}
        onKeyDown={handleKeyDown}
      >
        {showRange &&
          <>
            <span className={css.limit}>{min}</span>
            <span className={css.limit}>{max}</span>
          </>
        }
        <div className={css.indicator}
          style={{left: pos}}
        >
          <div className={css.tooltip} ref={tooltipRef}
            style={{
              display: isDragging ? "block" : "",
            }}
          >
            {currentVal}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Slider;
