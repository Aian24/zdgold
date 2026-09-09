import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

const baseCustomClass = {
  popup: 'dg-swal-popup',
  title: 'dg-swal-title',
  htmlContainer: 'dg-swal-html',
  actions: 'dg-swal-actions',
  confirmButton: 'dg-swal-confirm-gold',
  cancelButton: 'dg-swal-cancel',
};

// Luxury Gold Styled SweetAlert2 instance
export const GoldSwal = Swal.mixin({
  customClass: baseCustomClass,
  buttonsStyling: false,
  showClass: {
    popup: 'swal2-show animate-scale-up',
    backdrop: 'swal2-backdrop-show',
  },
  hideClass: {
    popup: 'swal2-hide animate-scale-down',
    backdrop: 'swal2-backdrop-hide',
  },
});

/**
 * Trigger celebration confetti
 */
export const triggerConfetti = () => {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#D4AF37', '#F3E5AB', '#AA7A1E', '#10B981'],
    });
  } catch (e) {
    // ignore in server context
  }
};

/**
 * Show animated Success Modal / Toast
 */
export const showSuccessAlert = async (title: string, text?: string, autoCloseMs = 3000) => {
  triggerConfetti();
  return GoldSwal.fire({
    icon: 'success',
    title,
    text,
    timer: autoCloseMs,
    timerProgressBar: true,
    showConfirmButton: true,
    confirmButtonText: 'Great, Continue',
    customClass: {
      ...baseCustomClass,
      confirmButton: 'dg-swal-confirm-gold',
    },
  });
};

/**
 * Show animated Error Alert
 */
export const showErrorAlert = async (title: string, text?: string) => {
  return GoldSwal.fire({
    icon: 'error',
    title,
    text: text || 'An unexpected error occurred. Please try again.',
    confirmButtonText: 'Dismiss',
    customClass: {
      ...baseCustomClass,
      confirmButton: 'dg-swal-confirm-danger',
    },
  });
};

/**
 * Show animated Warning / Confirmation Dialog
 * Returns Promise<boolean> (true if confirmed, false if cancelled)
 */
export const showConfirmDialog = async ({
  title,
  text,
  confirmButtonText = 'Yes, Proceed',
  cancelButtonText = 'Cancel',
  isDanger = true,
}: {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDanger?: boolean;
}): Promise<boolean> => {
  const result = await GoldSwal.fire({
    icon: isDanger ? 'warning' : 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    customClass: {
      ...baseCustomClass,
      confirmButton: isDanger ? 'dg-swal-confirm-danger' : 'dg-swal-confirm-gold',
      cancelButton: 'dg-swal-cancel',
    },
  });

  return result.isConfirmed;
};

/**
 * Show animated Toast notification
 */
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'dg-swal-toast',
      title: 'dg-swal-toast-title',
    },
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  Toast.fire({
    icon,
    title,
  });
};
