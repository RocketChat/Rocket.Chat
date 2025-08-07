import type { MediaCallsSignalProps } from './MediaCallsSignalProps';

export * from './MediaCallsSignalProps';

export type MediaCallsEndpoints = {
	'/v1/media-calls.signal': {
		POST: (params: MediaCallsSignalProps) => void;
	};
};
