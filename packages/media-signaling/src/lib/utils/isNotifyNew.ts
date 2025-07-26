import type { MediaSignal, MediaSignalNotify } from '../../definition';

export function isNotifyNew(signal: MediaSignal): signal is MediaSignalNotify<'new'> {
	return signal.type === 'notify' && signal.body.notify === 'new';
}
