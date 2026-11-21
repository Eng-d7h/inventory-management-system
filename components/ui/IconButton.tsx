import { LucideIcon } from "lucide-react";

type IconButtonColor = "primary" | "danger" | "accent" | "gray";

const colorClasses: Record<IconButtonColor, string> = {
  primary: "text-primary hover:bg-primary/10",
  danger: "text-danger hover:bg-danger/10",
  accent: "text-green-700 hover:bg-accent/15",
  gray: "text-gray-500 hover:bg-gray-100",
};

// A small square button that shows only an icon.
// "label" is required: it is read by screen readers and shown as a tooltip.
export default function IconButton({
  icon: Icon,
  label,
  color = "gray",
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  color?: IconButtonColor;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${colorClasses[color]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
