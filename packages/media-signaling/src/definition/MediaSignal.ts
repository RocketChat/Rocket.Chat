import type { MediaSignalDeliver } from './MediaSignalDeliver';
import type { MediaSignalNotify } from './MediaSignalNotify';
import type { MediaSignalRequest } from './MediaSignalRequest';

export type MediaSignal = MediaSignalRequest | MediaSignalDeliver | MediaSignalNotify;

export type ClientMediaSignal<T extends MediaSignal = MediaSignal> = Omit<T, 'callId' | 'sessionId' | 'version' | 'sequence' | 'role'>;
