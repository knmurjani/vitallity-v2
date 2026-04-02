import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  testId?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  testId,
}: QuantityStepperProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <div className="inline-flex items-center border border-border rounded-[14px] overflow-hidden" data-testid={testId}>
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center text-text-mid hover:bg-primary/5 disabled:opacity-30 transition-colors"
        data-testid={testId ? `${testId}-decrement` : undefined}
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        value={value}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="w-14 h-10 text-center text-sm font-medium bg-transparent border-x border-border outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center text-text-mid hover:bg-primary/5 disabled:opacity-30 transition-colors"
        data-testid={testId ? `${testId}-increment` : undefined}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
