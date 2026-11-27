import { createContext } from 'react';

export type UiKitAction = { appId?: string; blockId?: string; actionId: string; value?: string };

export type UiKitContextValue = {
	surface: 'message';
	onAction: (action: UiKitAction) => void;
};

export const UiKitContext = createContext<UiKitContextValue>({ surface: 'message', onAction: () => undefined });
