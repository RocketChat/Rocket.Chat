import { createContext, useContext } from 'react';

/** Keeps the toolbar shown while one of its popups (a menu, the reaction picker) is open. */
export const MessageToolbarVisibilityContext = createContext<(isPopupOpen: boolean) => void>(() => undefined);

export const useHoldMessageToolbar = () => useContext(MessageToolbarVisibilityContext);
