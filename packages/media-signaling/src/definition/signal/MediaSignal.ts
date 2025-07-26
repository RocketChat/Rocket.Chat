import type { MediaSignalDeliver } from './MediaSignalDeliver';
import type { MediaSignalNotify } from './MediaSignalNotify';
import type { MediaSignalRequest } from './MediaSignalRequest';

export type MediaSignalMap = {
	request: MediaSignalRequest;
	deliver: MediaSignalDeliver;
	notify: MediaSignalNotify;
};

export type MediaSignalType = keyof MediaSignalMap;

export type MediaSignal<T extends MediaSignalType = MediaSignalType> = MediaSignalMap[T];

export type ClientMediaSignal<T extends MediaSignal> = Omit<T, 'callId' | 'sessionId' | 'version' | 'sequence' | 'role'>;

export type MediaSignalBody<T extends MediaSignalType = MediaSignalType> = MediaSignal<T>['body'];
