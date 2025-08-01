import type { IMediaCall } from '@rocket.chat/core-typings';

import type { MediaCallsSignalProps } from './MediaCallsSignalProps';
import type { MediaCallsStartProps } from './MediaCallsStartProps';

export * from './MediaCallsSignalProps';
export * from './MediaCallsStartProps';

export type MediaCallsEndpoints = {
	'/v1/media-calls.start': {
		POST: (params: MediaCallsStartProps) => { call: IMediaCall };
	};
	'/v1/media-calls.signal': {
		POST: (params: MediaCallsSignalProps) => void;
	};
};
