import { createContext, useContext } from 'react';

/** The element over the call where notices about things outside it are drawn; null until it is mounted. */
export const CallStageNoticesContext = createContext<HTMLElement | null>(null);

export const useCallStageNoticesHost = (): HTMLElement | null => useContext(CallStageNoticesContext);
