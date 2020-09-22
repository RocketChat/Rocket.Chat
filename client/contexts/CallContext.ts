import { createContext, useContext } from 'react';

type CallActions = {
	id: string;
	icon?: string;
	variation?: 'success' | 'danger' | 'normal';
	disabled?: boolean;
	callback: () => undefined;
}

type Call = {
	name: string;
	avatar: string;
	actions: Array<CallActions>;
}

type CallContextValue = {
	calls: Array<Call>;
	setCalls: (calls) => {};
}

export const CallContext = createContext<CallContextValue>({
	calls: [],
	setCalls: () => undefined,
});

export const useCall = (): CallContextValue =>
	useContext(CallContext);
