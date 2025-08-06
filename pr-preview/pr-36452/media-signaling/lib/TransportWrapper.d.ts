import type { MediaSignalAnswer, MediaSignalHangup, AgentMediaSignalType, MediaSignalBody, AgentMediaSignal } from '../definition/MediaSignal';
import type { MediaSignalAgentTransport } from '../definition/MediaSignalTransport';
export declare class MediaSignalTransportWrapper {
    readonly contractId: string;
    private sendSignalFn;
    constructor(contractId: string, sendSignalFn: MediaSignalAgentTransport);
    sendToServer<T extends AgentMediaSignalType>(callId: string, type: T, signal: MediaSignalBody<T>): void;
    sendError(callId: string, errorCode: string): void;
    answer(callId: string, answer: MediaSignalAnswer['answer']): void;
    hangup(callId: string, reason: MediaSignalHangup['reason']): void;
    sendSignal(signal: AgentMediaSignal): void;
}
//# sourceMappingURL=TransportWrapper.d.ts.map