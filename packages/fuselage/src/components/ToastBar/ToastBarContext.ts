import { createContext, useContext } from 'react';

export type ToastBarVariant = 'info' | 'success' | 'error';

export const ToastBarContext = createContext<ToastBarVariant | undefined>(undefined);

export const useToastBarVariant = () => useContext(ToastBarContext);
