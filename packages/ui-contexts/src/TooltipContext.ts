import { createContext, ReactElement } from 'react';

type TooltipPayload = ReactElement;

export type TooltipContextValue = {
	open: (payload: TooltipPayload, anchor: HTMLElement) => void;
	close: () => void;
};

export const TooltipContext = createContext<TooltipContextValue>({
	open: () => undefined,
	close: () => undefined,
});
