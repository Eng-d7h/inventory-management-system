// Stock status is calculated, never stored (decision 4)

export type StockStatus = "in" | "low" | "out";

export function getStockStatus(currentStock: number, minimumStock: number): StockStatus {
  if (currentStock === 0) return "out";
  if (currentStock <= minimumStock) return "low";
  return "in";
}

// Text and badge color for each status
export const stockStatusInfo: Record<
  StockStatus,
  { label: string; color: "green" | "yellow" | "red" }
> = {
  in: { label: "In Stock", color: "green" },
  low: { label: "Low Stock", color: "yellow" },
  out: { label: "Out of Stock", color: "red" },
};
