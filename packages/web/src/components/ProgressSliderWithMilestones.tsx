import { Slider } from "@goalify/ui";

interface ProgressSliderWithMilestonesProps {
  value: number;
  onChange?: (value: number) => void;
  color?: string;
  readOnly?: boolean;
}

const ProgressSliderWithMilestones: React.FC<
  ProgressSliderWithMilestonesProps
> = ({ value, onChange, color = "var(--vibrant-blue)", readOnly = false }) => {
  return (
    <div className="relative w-full">
      {readOnly ? (
        <div className="relative h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="absolute h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${value}%`,
              background: color,
            }}
          />
        </div>
      ) : (
        <Slider
          value={[value]}
          onValueChange={([val]) => onChange?.(val)}
          max={100}
          step={1}
          rangeStyle={{ backgroundColor: color }}
          className="cursor-pointer"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      )}
      <div className="relative mt-2.5 h-4">
        {[0, 25, 50, 75, 100].map((mark) => (
          <div
            key={mark}
            className="absolute flex flex-col items-center"
            style={{ left: `${mark}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-px h-1.5 bg-[var(--muted-foreground)]/40" />
            <span className="text-[9px] font-bold text-[var(--muted-foreground)]/60">
              {mark}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressSliderWithMilestones;
