import React, {
  useEffect, useState, useRef, useCallback, useLayoutEffect,
} from "react";
import css from "./slider.module.scss";
import {clip, round, rangeMapping} from "@/common/utils/helpers.ts";
console.log(typeof css);
const pointSize = Number(css["point-size"].slice(0, -2));
const pointRadius = pointSize / 2;

type SliderProps = {
  min?: number;
  max?: number;
  defaultValue?: number;
  value?: number;
  digit?: number;
  step?: number;
  showRange?: boolean;
  showVal?: boolean;
  trackerBackground?: string;
  pointBackground?: string;
  onChange?: (val: number) => void;
}

const Slider = ({
  min = 0,
  max = 100,
  defaultValue,
  value,
  digit = 3,
  step,
  showRange = true,
  showVal = true,
  trackerBackground,
  pointBackground,
  onChange,
}: SliderProps) => {
  const trackerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(() => false);

  const [currentVal, setCurrentVal] = useState<number>(() => {
    const val = defaultValue !== undefined ?
        defaultValue :
        (value !== undefined ? value : (max + min) / 2);
    return clip(val, min, max);
  });
  const [pos, setPos] = useState<number>(() => pointRadius);

  const updateValue = useCallback((newVal: number, pos?: number) => {
    setCurrentVal(newVal);
    if (newVal !== currentVal && onChange) onChange(newVal);
    if (pos === undefined) {
      const rect = trackerRef.current?.getBoundingClientRect() as DOMRect;
      pos = round(rangeMapping(
          newVal, min, max,
          pointRadius, rect.right - rect.left - pointRadius,
      ));
    }
    setPos(pos);
  }, [min, max, onChange]);

  useLayoutEffect(() => {
    updateValue(currentVal);
  }, []);

  // Handle prop `value`, `min`, and `max` changed.
  useLayoutEffect(() => {
    const newVal = round(
        clip(value !== undefined ? value : currentVal, min, max),
        digit,
    );
    updateValue(newVal);
  }, [value, min, max, onChange]);

  // Step increment function. If num < 0, then becomes decrement.
  const increment = (num: number = 1) => {
    const unitVal = step ? step : 10**(-digit);
    const newVal = round(
        clip(currentVal + num * unitVal, min, max),
        digit,
    );
    updateValue(newVal);
  };

  // onChange event => Drag or key down.
  // -Mouse down / Touch start.
  // -Mouse move / Touch move.
  const handleDrag = useCallback((
      e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  ) => {
    if (!e.type.endsWith("move")) { // touch start / mouse down
      (e.currentTarget as HTMLDivElement).focus();
      if (tooltipRef.current === e.target) return; // Prevent dragging tooltip.
      setIsDragging(true);
    } else if (!isDragging) return;
    const rect = trackerRef.current?.getBoundingClientRect() as DOMRect;
    // Get cursor position.
    const clientX = (
      (e as MouseEvent).clientX || (e as TouchEvent).touches[0].clientX
    );
    // Evaluate value.
    const pointPos = clip(
        clientX - rect.left, pointRadius, rect.width - pointRadius,
    );
    const valBias = rangeMapping(
        pointPos, pointRadius, rect.width - pointRadius,
        0, max - min,
    );
    let val: number;
    if (step) val = round(min + Math.floor(valBias / step) * step, digit);
    else val = round(min + valBias, digit);
    updateValue(val, pointPos);
  }, [isDragging, max, min, onChange]);

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
    if (e.key == "ArrowRight") increment();
    else if (e.key === "ArrowLeft") increment(-1);
  };
  // end: onChange event

  return (
    <div className={css.sliderWrapper}>
      <div className={css.tracker} ref={trackerRef} tabIndex={-1}
        style={{
          background: trackerBackground,
        }}
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
        <div className={css.point}
          style={{
            left: `${pos}px`,
            background: pointBackground,
          }}
        >
          {showVal &&
            <div className={css.tooltip} ref={tooltipRef}
              style={{
                display: isDragging ? "block" : "",
              }}
            >
              {currentVal}
            </div>
          }
        </div>
      </div>
    </div>
  );
};
export default Slider;
