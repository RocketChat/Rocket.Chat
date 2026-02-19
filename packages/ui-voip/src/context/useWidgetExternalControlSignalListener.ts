import type { EventHandlerOf } from '@rocket.chat/emitter';
import { useEffect } from 'react';

import { useMediaCallInstanceContext, type Signals } from './MediaCallInstanceContext';

export const useWidgetExternalControlSignalListener = <T extends keyof Signals>(signal: T, callback: EventHandlerOf<Signals, T>) => {
	const { signalEmitter } = useMediaCallInstanceContext();

	useEffect(() => {
		return signalEmitter.on(signal, callback);
	}, [callback, signal, signalEmitter]);
};
