import type { MediaSignal } from '@rocket.chat/media-signaling';
export declare function assertSignalHasSessionId(signal: MediaSignal): asserts signal is MediaSignal & {
    sessionId: Required<MediaSignal>['sessionId'];
};
