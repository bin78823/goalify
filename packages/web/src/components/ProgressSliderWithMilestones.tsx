import { Slider } from "@goalify/ui";

interface ProgressSliderWithMilestonesProps {
  value: number;
  onChange: (value: number) => void;
  color?: string;
}

const ProgressSliderWithMilestones: React.FC<
  ProgressSliderWithMilestonesProps
> = ({ value, onChange, color = "var(--vibrant-blue)" }) => {
  return (
    <div className="relative">
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        max={100}
        step={1}
        rangeStyle={{ backgroundColor: color }}
        className="cursor-pointer"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <div className="relative mt-2 h-4">
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
