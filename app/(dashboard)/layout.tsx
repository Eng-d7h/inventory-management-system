import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
