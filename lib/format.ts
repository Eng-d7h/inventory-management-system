// 12.5 -> "$12.50"
export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

// Firestore Timestamp -> "Nov 21, 2026, 3:45 PM"
export function formatDateTime(value: { toDate: () => Date } | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value.toDate());
}
