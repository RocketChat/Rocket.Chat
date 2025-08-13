import { Emitter } from '@rocket.chat/emitter';
import type { ClientMediaSignal, ClientState, IServiceProcessorFactoryList, MediaSignalTransport, MediaStreamFactory, ServerMediaSignal } from '../definition';
import type { IClientMediaCall, CallState, CallActorType, CallContact } from '../definition/call';
import type { IMediaSignalLogger } from '../definition/logger';
export type MediaSignalingEvents = {
    callContactUpdate: {
        call: IClientMediaCall;
    };
    callStateChange: {
        call: IClientMediaCall;
        oldState: CallState;
    };
    callClientStateChange: {
        call: IClientMediaCall;
        oldState: ClientState;
    };
    newCall: {
        call: IClientMediaCall;
    };
    acceptedCall: {
        call: IClientMediaCall;
    };
    activeCall: {
        call: IClientMediaCall;
    };
    endedCall: {
        call: IClientMediaCall;
    };
    hiddenCall: {
        call: IClientMediaCall;
    };
};
export type MediaSignalingSessionConfig = {
    userId: string;
    oldSessionId?: string;
    logger?: IMediaSignalLogger;
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
    private recurringStateReportHandler;
    private callCount;
    get sessionId(): string;
    get userId(): string;
    constructor(config: MediaSignalingSessionConfig);
    isBusy(): boolean;
    enableStateReport(interval: number): void;
    disableStateReport(): void;
    getCallData(callId: string): IClientMediaCall | null;
    getMainCall(): IClientMediaCall | null;
    processSignal(signal: ServerMediaSignal): Promise<void>;
    startCall(calleeType: CallActorType, calleeId: string, contactInfo?: CallContact): Promise<void>;
    private createTemporaryCallId;
    private isSignalTargetingAnotherSession;
    private isCallIgnored;
    private ignoreCall;
    private getExistingCallBySignal;
    private getOrCreateCallBySignal;
    private reportState;
    private register;
    private createCall;
    private createWeakToken;
    private onCallContactUpdate;
    private onCallStateChange;
    private onCallClientStateChange;
    private onNewCall;
    private onAcceptedCall;
    private onEndedCall;
    private onHiddenCall;
    private onActiveCall;
}
//# sourceMappingURL=Session.d.ts.map