import { useState, useCallback } from 'react';

export function useConfirm() {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: '',
    itemName: '',
    confirmText: 'Confirm',
    onConfirm: null
  });

  const requestConfirm = useCallback(
    ({
      title = 'Confirm Action',
      message = 'This action will modify local data. Are you sure you want to proceed?',
      itemName = '',
      confirmText = 'Confirm',
      onConfirm
    }) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        itemName,
        confirmText,
        onConfirm: async () => {
          try {
            if (onConfirm) await onConfirm();
          } finally {
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }
        }
      });
    },
    []
  );

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    confirmModal,
    requestConfirm,
    closeConfirmModal
  };
}
