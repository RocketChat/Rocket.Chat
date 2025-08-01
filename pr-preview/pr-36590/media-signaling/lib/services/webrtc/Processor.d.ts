import type { IWebRTCProcessor, MediaSignalRequestOffer, MediaSignalSDP, WebRTCProcessorConfig } from '../../../definition';
export declare class MediaCallWebRTCProcessor implements IWebRTCProcessor {
    private readonly config;
    private peer;
    private iceGatheringFinished;
    private localStream;
    private localMediaStream;
    private localMediaStreamInitialized;
    private remoteStream;
    private remoteMediaStream;
    private iceGatheringWaiters;
    constructor(config: WebRTCProcessorConfig);
    getRemoteMediaStream(): MediaStream;
    createOffer({ iceRestart }: MediaSignalRequestOffer): Promise<MediaSignalSDP>;
    createAnswer({ sdp }: MediaSignalSDP): Promise<MediaSignalSDP>;
    setRemoteDescription({ sdp }: MediaSignalSDP): Promise<void>;
    protected getuserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
    private getLocalDescription;
    private waitForIceGathering;
    private registerPeerEvents;
    private restartIce;
    private onIceCandidate;
    private onIceCandidateError;
    private onNegotiationNeeded;
    private onTrack;
    private onConnectionStateChange;
    private onIceConnectionStateChange;
    private onSignalingStateChange;
    private onIceGatheringStateChange;
    private initializeLocalMediaStream;
    private onIceGatheringComplete;
    private clearIceGatheringData;
    private clearIceGatheringWaiters;
}
//# sourceMappingURL=Processor.d.ts.map