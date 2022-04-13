import { createContext, useContext, ReactNode } from "react";

type ModalContextValue = {
  setModal: (modal: ReactNode) => void;
  open: (config: Record<string, unknown>, fn?: () => void, onCancel?: () => void) => void;
  push: (config: Record<string, unknown>, fn?: () => void, onCancel?: () => void) => void;
  cancel: () => void;
  close: () => void;
  confirm: (value: boolean) => void;
};

export const ModalContext = createContext<ModalContextValue | undefined>(
  undefined
);

export const useModal = (): ModalContextValue => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const useSetModal = (): ((modal?: ReactNode) => void) => {
  return useModal().setModal;
};
