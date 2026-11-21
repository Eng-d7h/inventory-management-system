"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  confirmDisabled?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// A small "Are you sure?" dialog, used before any delete
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  confirmDisabled = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading ? "Deleting..." : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-gray-700">
        <div>{message}</div>
        {error && <p className="text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
