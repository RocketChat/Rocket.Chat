import type { ReactNode } from 'react';

import { CallPinsProvider } from './context.js';
import { useCallPinsState } from './hooks/useCallPinsState.js';

export type CallPinScopeProps = {
	children: ReactNode;
};

/** Pins last as long as this is mounted. */
const CallPinScope = ({ children }: CallPinScopeProps) => {
	const pins = useCallPinsState();

	return <CallPinsProvider value={pins}>{children}</CallPinsProvider>;
};

export default CallPinScope;
