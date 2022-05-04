import { createContext, ReactElement, useContext } from 'react';

type TooltipPayload = ReactElement;

type TooltipContextValue = {
	open: (payload: TooltipPayload, anchor: HTMLElement) => void;
	close: () => void;
};

export const TooltipContext = createContext<TooltipContextValue>({
	open: () => undefined,
	close: () => undefined,
});

export const useTooltipOpen = (): TooltipContextValue['open'] => useContext(TooltipContext).open;
export const useTooltipClose = (): TooltipContextValue['close'] => useContext(TooltipContext).close;
