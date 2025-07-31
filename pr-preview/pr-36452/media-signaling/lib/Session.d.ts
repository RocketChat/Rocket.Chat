import { Emitter } from '@rocket.chat/emitter';
import type { IServiceProcessorFactoryList } from '../definition/IServiceProcessorFactoryList';
import type { MediaSignal } from '../definition/MediaSignal';
import type { MediaSignalTransport } from '../definition/MediaSignalTransport';
import type { MediaStreamFactory } from '../definition/MediaStreamFactory';
import { type IClientMediaCall, type CallContact, type CallState } from '../definition/call';
export type MediaSignalingEvents = {
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
    transport: MediaSignalTransport;
};
export declare class MediaSignalingSession extends Emitter<MediaSignalingEvents> {
    private config;
    private _userId;
    private readonly _sessionId;
    private knownCalls;
    private contactInformation;
    private ignoredCalls;
    private failedCalls;
    private transporter;
    get sessionId(): string;
    get userId(): string;
    constructor(config: MediaSignalingSessionConfig);
    isBusy(): boolean;
    getCallData(callId: string): IClientMediaCall | null;
    getAllCallStates(): CallState[];
    hasAnyCallState(states: CallState[]): boolean;
    getSortedCalls(): IClientMediaCall[];
    getMainCall(): IClientMediaCall | null;
    processSignal(signal: MediaSignal): Promise<void>;
    getStoredCallContact(callId: string): CallContact;
    setCallContact(callId: string, contact: Record<string, string>): void;
    private isSignalTargetingAnotherSession;
    private isCallKnown;
    private isCallIgnored;
    private processNewCall;
    private createWebRtcProcessor;
}
//# sourceMappingURL=Session.d.ts.map