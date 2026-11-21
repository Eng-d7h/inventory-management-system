import Header from "@/components/layout/Header";
import StockMovementsTable from "@/components/inventory/StockMovementsTable";

export default function TransactionsPage() {
  return (
    <>
      <Header title="Transactions" />
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Transactions</h1>
          <p className="text-sm text-gray-500">
            All stock movements (read-only). Add new ones from the Inventory page.
          </p>
        </div>
        <StockMovementsTable />
      </main>
    </>
  );
}
