import type { MediaSignal, MediaSignalAnswer, MediaSignalBody, MediaSignalBodyAndType, MediaSignalHangup, MediaSignalNotification, MediaSignalType } from '../definition/MediaSignal';
import type { MediaSignalTransport } from '../definition/MediaSignalTransport';
export declare class MediaSignalTransportWrapper {
    readonly sessionId: string;
    private sendSignalFn;
    constructor(sessionId: string, sendSignalFn: MediaSignalTransport);
    sendToServer<T extends MediaSignalType>(callId: string, type: T, body: MediaSignalBody<T>): void;
    sendError(callId: string, errorCode: string): void;
    answer(callId: string, answer: MediaSignalAnswer['answer']): void;
    hangup(callId: string, reason: MediaSignalHangup['reason']): void;
    notify(callId: string, notification: MediaSignalNotification['notification']): void;
    sendSignalToServer<T extends MediaSignalType>(callId: string, signal: MediaSignalBodyAndType<T>): void;
    sendSignal(signal: MediaSignal): void;
}
//# sourceMappingURL=TransportWrapper.d.ts.map