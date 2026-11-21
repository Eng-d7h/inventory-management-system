// One column of the table:
// - header: the title shown at the top
// - render: how to show this column for one row
export type Column<T> = {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
};

export default function Table<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No data found.",
  rowClassName,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getRowKey(row)}
                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                  rowClassName?.(row) ?? ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3 text-gray-700 ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
