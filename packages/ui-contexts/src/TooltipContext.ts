import type { ReactNode } from 'react';
import { createContext } from 'react';

export type TooltipContextValue = {
	open: (payload: ReactNode, anchor: HTMLElement) => void;
	close: () => void;
};

export const TooltipContext = createContext<TooltipContextValue>({
	open: () => undefined,
	close: () => undefined,
});
