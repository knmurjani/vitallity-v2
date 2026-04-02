import { useRef, useCallback, useEffect, useState } from "react";

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  leftLabel?: string;
  rightLabel?: string;
  testId?: string;
}

export function RangeSlider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  leftLabel,
  rightLabel,
  testId,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;

  const updateValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      onChange(clamped);
    },
    [min, max, step, onChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      updateValue(e.clientX);
    },
    [updateValue]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setDragging(true);
      updateValue(e.touches[0].clientX);
    },
    [updateValue]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updateValue(clientX);
    };

    const handleUp = () => setDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragging, updateValue]);

  return (
    <div className="w-full" data-testid={testId}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-primary bg-primary/8 rounded-full w-8 h-8 flex items-center justify-center">
          {value}
        </span>
      </div>

      <div
        ref={trackRef}
        className="relative h-2 bg-border rounded-full cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Filled track */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-primary transition-[width] duration-75"
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-primary rounded-full shadow-md transition-[left] duration-75 hover:scale-110"
          style={{ left: `${percentage}%` }}
        />
      </div>

      {(leftLabel || rightLabel) && (
        <div className="flex justify-between mt-2">
          <span className="text-xs text-text-light">{leftLabel}</span>
          <span className="text-xs text-text-light">{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
