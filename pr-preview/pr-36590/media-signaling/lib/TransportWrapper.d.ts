import type { CallAnswer, CallHangupReason } from '../definition';
import type { IMediaSignalLogger } from '../definition/logger';
import type { MediaSignalTransport, ClientMediaSignalType, ClientMediaSignalBody, ClientMediaSignal } from '../definition/signals';
export declare class MediaSignalTransportWrapper {
    readonly contractId: string;
    private sendSignalFn;
    private logger?;
    constructor(contractId: string, sendSignalFn: MediaSignalTransport<ClientMediaSignal>, logger?: IMediaSignalLogger | undefined);
    sendToServer<T extends ClientMediaSignalType>(callId: string, type: T, signal: ClientMediaSignalBody<T>): void;
    sendError(callId: string, errorCode: string): void;
    answer(callId: string, answer: CallAnswer): void;
    hangup(callId: string, reason: CallHangupReason): void;
    sendSignal(signal: ClientMediaSignal): void;
}
//# sourceMappingURL=TransportWrapper.d.ts.map