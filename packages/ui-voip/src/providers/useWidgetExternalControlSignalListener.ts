import type { EventHandlerOf } from '@rocket.chat/emitter';
import { useEffect } from 'react';

import { useMediaCallInstance, type Signals } from '../context/MediaCallInstanceContext';

export const useWidgetExternalControlSignalListener = <T extends keyof Signals>(signal: T, callback: EventHandlerOf<Signals, T>) => {
	const { signalEmitter } = useMediaCallInstance();

	useEffect(() => {
		return signalEmitter.on(signal, callback);
	}, [callback, signal, signalEmitter]);
};
