import type { CallAnswer, CallHangupReason } from '../definition';
import type { MediaSignalTransport, ClientMediaSignalType, ClientMediaSignalBody, ClientMediaSignal } from '../definition/signals';
export declare class MediaSignalTransportWrapper {
    readonly contractId: string;
    private sendSignalFn;
    constructor(contractId: string, sendSignalFn: MediaSignalTransport<ClientMediaSignal>);
    sendToServer<T extends ClientMediaSignalType>(callId: string, type: T, signal: ClientMediaSignalBody<T>): void;
    sendError(callId: string, errorCode: string): void;
    answer(callId: string, answer: CallAnswer): void;
    hangup(callId: string, reason: CallHangupReason): void;
    sendSignal(signal: ClientMediaSignal): void;
}
//# sourceMappingURL=TransportWrapper.d.ts.map