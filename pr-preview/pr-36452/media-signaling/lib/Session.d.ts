import { Emitter } from '@rocket.chat/emitter';
import type { ClientMediaSignal, IServiceProcessorFactoryList, MediaSignalTransport, MediaStreamFactory, ServerMediaSignal } from '../definition';
import type { IClientMediaCall, CallState, CallActorType, CallContact } from '../definition/call';
export type MediaSignalingEvents = {
    callContactUpdate: {
        call: IClientMediaCall;
    };
    callStateChange: {
        call: IClientMediaCall;
        oldState: CallState;
    };
    newCall: {
        call: IClientMediaCall;
    };
    acceptedCall: {
        call: IClientMediaCall;
    };
    endedCall: {
        call: IClientMediaCall;
    };
};
export type MediaSignalingSessionConfig = {
    userId: string;
    processorFactories: IServiceProcessorFactoryList;
    mediaStreamFactory: MediaStreamFactory;
    transport: MediaSignalTransport<ClientMediaSignal>;
};
export declare class MediaSignalingSession extends Emitter<MediaSignalingEvents> {
    private config;
    private _userId;
    private readonly _sessionId;
    private knownCalls;
    private ignoredCalls;
    private transporter;
    get sessionId(): string;
    get userId(): string;
    constructor(config: MediaSignalingSessionConfig);
    isBusy(): boolean;
    getCallData(callId: string): IClientMediaCall | null;
    getMainCall(): IClientMediaCall | null;
    processSignal(signal: ServerMediaSignal): Promise<void>;
    startCall(calleeType: CallActorType, calleeId: string, contactInfo?: CallContact): Promise<void>;
    private createTemporaryCallId;
    private isSignalTargetingAnotherSession;
    private isCallIgnored;
    private ignoreCall;
    private getOrCreateCall;
    private getOrCreateCallBySignal;
    private createCall;
}
//# sourceMappingURL=Session.d.ts.map