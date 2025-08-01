import type { MediaSignalType } from '../../definition';

export function signalTypeRequiresTargeting(signalType: MediaSignalType): boolean {
	return ['request-offer', 'sdp'].includes(signalType);
}
