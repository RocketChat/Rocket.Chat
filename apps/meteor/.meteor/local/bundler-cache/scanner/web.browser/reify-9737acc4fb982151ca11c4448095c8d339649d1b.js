module.export({startLocalConference:()=>startLocalConference,WebAudioSessionDescriptionHandler:()=>WebAudioSessionDescriptionHandler});let SessionDescriptionHandler;module.link("./session-description-handler.js",{SessionDescriptionHandler(v){SessionDescriptionHandler=v}},0);
/**
 * Start a conference.
 * @param conferenceSessions - The sessions to conference.
 *
 * @beta
 */
function startLocalConference(conferenceSessions) {
    if (conferenceSessions.length < 2) {
        throw new Error("Start local conference requires at leaast 2 sessions.");
    }
    // Return all possible pairs of elements in an array.
    const pairs = (arr) => arr.map((v, i) => arr.slice(i + 1).map((w) => [v, w])).reduce((acc, curVal) => acc.concat(curVal), []);
    // For each pair of sessions making up the conference, join their media together.
    // A session desciprion handler manages the media, streams and tracks for a session.
    pairs(conferenceSessions.map((session) => session.sessionDescriptionHandler)).forEach(([sdh0, sdh1]) => {
        if (!(sdh0 instanceof WebAudioSessionDescriptionHandler && sdh1 instanceof WebAudioSessionDescriptionHandler)) {
            throw new Error("Session description handler not instance of SessionManagerSessionDescriptionHandler");
        }
        sdh0.joinWith(sdh1);
    });
}
/**
 * A WebAudioSessionDescriptionHandler uses the Web Audio API to enable local conferencing of audio streams.
 * @remarks
 * This handler only works for one track of audio per peer connection. While the session description handler
 * being extended supports both audio and video, attempting to utilize video with this handler is not defined.
 *
 * @beta
 */
class WebAudioSessionDescriptionHandler extends SessionDescriptionHandler {
    constructor(logger, mediaStreamFactory, sessionDescriptionHandlerConfiguration) {
        super(logger, mediaStreamFactory, sessionDescriptionHandlerConfiguration);
        if (!WebAudioSessionDescriptionHandler.audioContext) {
            WebAudioSessionDescriptionHandler.audioContext = new AudioContext();
        }
    }
    /**
     * Helper function to enable/disable media tracks.
     * @param enable - If true enable tracks.
     */
    enableSenderTracks(enable) {
        // This session decription handler is not using the original outbound (local) media stream source
        // and has instead inserted a Web Audio proxy media stream to allow conferencing and mixing of stream.
        // So here, we only want to mute the original source and not the proxy as it may be mixing other
        // sources into the outbound stream and we do not want to enable/disable those. We only want to
        // enable/disable the original stream source so that it's media gets muted/unmuted going to the proxy.
        const stream = this.localMediaStreamReal;
        if (stream === undefined) {
            throw new Error("Stream undefined.");
        }
        stream.getAudioTracks().forEach((track) => {
            track.enabled = enable;
        });
    }
    /**
     * Returns a WebRTC MediaStream proxying the provided audio media stream.
     * This allows additional Web Audio media stream source nodes to be connected
     * to the destination node assoicated with the returned stream so we can mix
     * aditional audio sorces into the local media stream (ie for 3-way conferencing).
     * @param stream - The MediaStream to proxy.
     */
    initLocalMediaStream(stream) {
        if (!WebAudioSessionDescriptionHandler.audioContext) {
            throw new Error("SessionManagerSessionDescriptionHandler.audioContext undefined.");
        }
        this.localMediaStreamReal = stream;
        this.localMediaStreamSourceNode = WebAudioSessionDescriptionHandler.audioContext.createMediaStreamSource(stream);
        this.localMediaStreamDestinationNode =
            WebAudioSessionDescriptionHandler.audioContext.createMediaStreamDestination();
        this.localMediaStreamSourceNode.connect(this.localMediaStreamDestinationNode);
        return this.localMediaStreamDestinationNode.stream;
    }
    /**
     * Join (conference) media streams with another party.
     * @param peer - The session description handler of the peer to join with.
     */
    joinWith(peer) {
        if (!WebAudioSessionDescriptionHandler.audioContext) {
            throw new Error("SessionManagerSessionDescriptionHandler.audioContext undefined.");
        }
        // Mix our inbound (remote) stream into the peer's outbound (local) streams.
        const ourNewInboundStreamSource = WebAudioSessionDescriptionHandler.audioContext.createMediaStreamSource(this.remoteMediaStream);
        const peerOutboundStreamDestination = peer.localMediaStreamDestinationNode;
        if (peerOutboundStreamDestination === undefined) {
            throw new Error("Peer outbound (local) stream local media stream destination is undefined.");
        }
        ourNewInboundStreamSource.connect(peerOutboundStreamDestination);
        // Mix the peer's inbound (remote) streams into our outbound (local) stream.
        const peerNewInboundStreamSource = WebAudioSessionDescriptionHandler.audioContext.createMediaStreamSource(peer.remoteMediaStream);
        const ourOutboundStreamDestination = this.localMediaStreamDestinationNode;
        if (ourOutboundStreamDestination === undefined) {
            throw new Error("Our outbound (local) stream local media stream destination is undefined.");
        }
        peerNewInboundStreamSource.connect(ourOutboundStreamDestination);
    }
    /**
     * Sets the original local media stream.
     * @param stream - Media stream containing tracks to be utilized.
     * @remarks
     * Only the first audio and video tracks of the provided MediaStream are utilized.
     * Adds tracks if audio and/or video tracks are not already present, otherwise replaces tracks.
     */
    setRealLocalMediaStream(stream) {
        if (!WebAudioSessionDescriptionHandler.audioContext) {
            throw new Error("SessionManagerSessionDescriptionHandler.audioContext undefined.");
        }
        if (!this.localMediaStreamReal) {
            this.initLocalMediaStream(stream);
            return;
        }
        if (!this.localMediaStreamDestinationNode || !this.localMediaStreamSourceNode || !this.localMediaStreamReal) {
            throw new Error("Local media stream undefined.");
        }
        this.localMediaStreamReal = stream;
        this.localMediaStreamSourceNode.disconnect(this.localMediaStreamDestinationNode);
        this.localMediaStreamSourceNode = WebAudioSessionDescriptionHandler.audioContext.createMediaStreamSource(stream);
        this.localMediaStreamSourceNode.connect(this.localMediaStreamDestinationNode);
    }
}
