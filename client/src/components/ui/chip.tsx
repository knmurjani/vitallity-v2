import { Check } from "lucide-react";

interface ChipProps {
  label: string;
  description?: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  testId?: string;
}

export function Chip({ label, description, selected, onToggle, disabled, testId }: ChipProps) {
  return (
    <button
      type="button"
      data-testid={testId || `chip-${label.toLowerCase().replace(/\s+/g, "-")}`}
      disabled={disabled}
      onClick={onToggle}
      className={`
        inline-flex items-center gap-2 rounded-[100px] border-[1.5px] px-4 py-2.5
        text-sm font-medium transition-all cursor-pointer select-none active:scale-[0.97]
        ${selected
          ? "border-primary bg-primary/8 text-primary"
          : "border-border bg-card text-text-mid hover:border-primary/40"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${description ? "flex-col items-start rounded-[14px] px-4 py-3" : ""}
      `}
    >
      <span className="flex items-center gap-2">
        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
        <span>{label}</span>
      </span>
      {description && (
        <span className="text-xs text-text-light font-normal leading-snug">{description}</span>
      )}
    </button>
  );
}

interface ChipGroupProps {
  options: { label: string; description?: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export function ChipGroup({ options, selected, onChange, multiple = false, disabled }: ChipGroupProps) {
  const handleToggle = (label: string) => {
    if (multiple) {
      if (selected.includes(label)) {
        onChange(selected.filter(s => s !== label));
      } else {
        onChange([...selected, label]);
      }
    } else {
      onChange(selected.includes(label) ? [] : [label]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2.5" data-testid="chip-group">
      {options.map(opt => (
        <Chip
          key={opt.label}
          label={opt.label}
          description={opt.description}
          selected={selected.includes(opt.label)}
          onToggle={() => handleToggle(opt.label)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
