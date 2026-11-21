type BadgeColor = "green" | "yellow" | "red" | "gray";

const colorClasses: Record<BadgeColor, string> = {
  green: "bg-accent/15 text-green-700",
  yellow: "bg-warning/20 text-yellow-800",
  red: "bg-danger/15 text-danger",
  gray: "bg-gray-200 text-gray-600",
};

export default function Badge({
  color = "gray",
  children,
}: {
  color?: BadgeColor;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}
