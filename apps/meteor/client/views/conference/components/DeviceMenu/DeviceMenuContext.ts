import { createContext, useContext } from 'react';

/** Closes the menu an option was picked from. */
export const DeviceMenuContext = createContext<() => void>(() => undefined);

export const useCloseDeviceMenu = () => useContext(DeviceMenuContext);
