var Emitter;module.link('@rocket.chat/emitter',{Emitter:function(v){Emitter=v}},0);var Registerer,RequestPendingError,SessionState,UserAgent,Invitation,Inviter,RegistererState,UserAgentState;module.link('sip.js',{Registerer:function(v){Registerer=v},RequestPendingError:function(v){RequestPendingError=v},SessionState:function(v){SessionState=v},UserAgent:function(v){UserAgent=v},Invitation:function(v){Invitation=v},Inviter:function(v){Inviter=v},RegistererState:function(v){RegistererState=v},UserAgentState:function(v){UserAgentState=v}},1);var SessionDescriptionHandler;module.link('sip.js/lib/platform/web',{SessionDescriptionHandler:function(v){SessionDescriptionHandler=v}},2);var LocalStream;module.link('./LocalStream',{default:function(v){LocalStream=v}},3);var RemoteStream;module.link('./RemoteStream',{default:function(v){RemoteStream=v}},4);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};





class VoipClient extends Emitter {
    constructor(config, mediaRenderer) {
        super();
        this.config = config;
        this.held = false;
        this.muted = false;
        this.online = true;
        this.error = null;
        this.contactInfo = null;
        this.register = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield ((_a = this.registerer) === null || _a === void 0 ? void 0 : _a.register({
                requestDelegate: {
                    onAccept: this.onRegistrationAccepted,
                    onReject: this.onRegistrationRejected,
                },
            }));
        });
        this.unregister = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield ((_a = this.registerer) === null || _a === void 0 ? void 0 : _a.unregister({
                all: true,
                requestDelegate: {
                    onAccept: this.onUnregistrationAccepted,
                    onReject: this.onUnregistrationRejected,
                },
            }));
        });
        this.call = (calleeURI, mediaRenderer) => __awaiter(this, void 0, void 0, function* () {
            if (!calleeURI) {
                throw new Error('Invalid URI');
            }
            if (this.session) {
                throw new Error('Session already exists');
            }
            if (!this.userAgent) {
                throw new Error('No User Agent.');
            }
            if (mediaRenderer) {
                this.switchMediaRenderer(mediaRenderer);
            }
            const target = this.makeURI(calleeURI);
            if (!target) {
                throw new Error(`Failed to create valid URI ${calleeURI}`);
            }
            const inviter = new Inviter(this.userAgent, target, {
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false,
                    },
                },
            });
            yield this.sendInvite(inviter);
        });
        this.transfer = (calleeURI) => __awaiter(this, void 0, void 0, function* () {
            if (!calleeURI) {
                throw new Error('Invalid URI');
            }
            if (!this.session) {
                throw new Error('No active call');
            }
            if (!this.userAgent) {
                throw new Error('No User Agent.');
            }
            const target = this.makeURI(calleeURI);
            if (!target) {
                throw new Error(`Failed to create valid URI ${calleeURI}`);
            }
            yield this.session.refer(target, {
                requestDelegate: {
                    onAccept: () => this.sendContactUpdateMessage(target),
                },
            });
        });
        this.answer = () => {
            if (!(this.session instanceof Invitation)) {
                throw new Error('Session not instance of Invitation.');
            }
            const invitationAcceptOptions = {
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false,
                    },
                },
            };
            return this.session.accept(invitationAcceptOptions);
        };
        this.reject = () => {
            if (!this.session) {
                return Promise.reject(new Error('No active call.'));
            }
            if (!(this.session instanceof Invitation)) {
                return Promise.reject(new Error('Session not instance of Invitation.'));
            }
            return this.session.reject();
        };
        this.endCall = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.session) {
                return Promise.reject(new Error('No active call.'));
            }
            switch (this.session.state) {
                case SessionState.Initial:
                case SessionState.Establishing:
                    if (this.session instanceof Inviter) {
                        return this.session.cancel();
                    }
                    if (this.session instanceof Invitation) {
                        return this.session.reject();
                    }
                    throw new Error('Unknown session type.');
                case SessionState.Established:
                    return this.session.bye();
                case SessionState.Terminating:
                case SessionState.Terminated:
                    break;
                default:
                    throw new Error('Unknown state');
            }
            return Promise.resolve();
        });
        this.setMute = (mute) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.muted === mute) {
                return Promise.resolve();
            }
            if (!this.session) {
                throw new Error('No active call.');
            }
            const { peerConnection } = this.sessionDescriptionHandler;
            if (!peerConnection) {
                throw new Error('Peer connection closed.');
            }
            try {
                const options = {
                    requestDelegate: {
                        onAccept: () => {
                            this.muted = mute;
                            this.toggleMediaStreamTracks('sender', !this.muted);
                            this.toggleMediaStreamTracks('receiver', !this.muted);
                            this.emit('stateChanged');
                        },
                        onReject: () => {
                            this.toggleMediaStreamTracks('sender', !this.muted);
                            this.toggleMediaStreamTracks('receiver', !this.muted);
                            this.emit('muteerror');
                        },
                    },
                };
                yield this.session.invite(options);
                this.toggleMediaStreamTracks('sender', !this.muted);
                this.toggleMediaStreamTracks('receiver', !this.muted);
            }
            catch (error) {
                if (error instanceof RequestPendingError) {
                    console.error(`[${(_a = this.session) === null || _a === void 0 ? void 0 : _a.id}] A mute request is already in progress.`);
                }
                this.emit('muteerror');
                throw error;
            }
        });
        this.setHold = (hold) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.held === hold) {
                return Promise.resolve();
            }
            if (!this.session) {
                throw new Error('Session not found');
            }
            const { sessionDescriptionHandler } = this;
            const sessionDescriptionHandlerOptions = this.session.sessionDescriptionHandlerOptionsReInvite;
            sessionDescriptionHandlerOptions.hold = hold;
            this.session.sessionDescriptionHandlerOptionsReInvite = sessionDescriptionHandlerOptions;
            const { peerConnection } = sessionDescriptionHandler;
            if (!peerConnection) {
                throw new Error('Peer connection closed.');
            }
            try {
                const options = {
                    requestDelegate: {
                        onAccept: () => {
                            this.held = hold;
                            this.toggleMediaStreamTracks('receiver', !this.held);
                            this.toggleMediaStreamTracks('sender', !this.held);
                            this.held ? this.emit('hold') : this.emit('unhold');
                            this.emit('stateChanged');
                        },
                        onReject: () => {
                            this.toggleMediaStreamTracks('receiver', !this.held);
                            this.toggleMediaStreamTracks('sender', !this.held);
                            this.emit('holderror');
                        },
                    },
                };
                yield this.session.invite(options);
                this.toggleMediaStreamTracks('receiver', !hold);
                this.toggleMediaStreamTracks('sender', !hold);
            }
            catch (error) {
                if (error instanceof RequestPendingError) {
                    console.error(`[${(_a = this.session) === null || _a === void 0 ? void 0 : _a.id}] A hold request is already in progress.`);
                }
                this.emit('holderror');
                throw error;
            }
        });
        this.sendDTMF = (tone) => {
            // Validate tone
            if (!tone || !/^[0-9A-D#*,]$/.exec(tone)) {
                return Promise.reject(new Error('Invalid DTMF tone.'));
            }
            if (!this.session) {
                return Promise.reject(new Error('Session does not exist.'));
            }
            const dtmf = tone;
            const duration = 2000;
            const body = {
                contentDisposition: 'render',
                contentType: 'application/dtmf-relay',
                content: `Signal=${dtmf}\r\nDuration=${duration}`,
            };
            const requestOptions = { body };
            return this.session.info({ requestOptions }).then(() => undefined);
        };
        this.clearErrors = () => {
            this.setError(null);
        };
        this.onUserAgentConnected = () => {
            this.networkEmitter.emit('connected');
            this.emit('stateChanged');
        };
        this.onUserAgentDisconnected = (error) => {
            this.networkEmitter.emit('disconnected');
            this.emit('stateChanged');
            if (error) {
                this.networkEmitter.emit('connectionerror', error);
                this.attemptReconnection();
            }
        };
        this.onRegistrationAccepted = () => {
            this.emit('registered');
            this.emit('stateChanged');
        };
        this.onRegistrationRejected = (error) => {
            this.emit('registrationerror', error);
        };
        this.onUnregistrationAccepted = () => {
            this.emit('unregistered');
            this.emit('stateChanged');
        };
        this.onUnregistrationRejected = (error) => {
            this.emit('unregistrationerror', error);
        };
        this.onIncomingCall = (invitation) => __awaiter(this, void 0, void 0, function* () {
            if (!this.isRegistered() || this.session) {
                yield invitation.reject();
                return;
            }
            this.initSession(invitation);
            this.emit('incomingcall', this.getContactInfo());
            this.emit('stateChanged');
        });
        this.onTransferedCall = (referral) => __awaiter(this, void 0, void 0, function* () {
            yield referral.accept();
            this.sendInvite(referral.makeInviter());
        });
        this.onMessageReceived = (message) => __awaiter(this, void 0, void 0, function* () {
            if (!message.request.hasHeader('X-Message-Type')) {
                message.reject();
                return;
            }
            const messageType = message.request.getHeader('X-Message-Type');
            switch (messageType) {
                case 'contactUpdate':
                    return this.updateContactInfoFromMessage(message);
            }
        });
        this.onSessionStablishing = () => {
            this.emit('outgoingcall', this.getContactInfo());
        };
        this.onSessionStablished = () => {
            this.setupRemoteMedia();
            this.emit('callestablished', this.getContactInfo());
            this.emit('stateChanged');
        };
        this.onInviteRejected = (response) => {
            var _a;
            const { statusCode, reasonPhrase, to } = response.message;
            if (!reasonPhrase || statusCode === 487) {
                return;
            }
            this.setError({
                status: statusCode,
                reason: reasonPhrase,
                contact: { id: (_a = to.uri.user) !== null && _a !== void 0 ? _a : '', host: to.uri.host },
            });
            this.emit('callfailed', response.message.reasonPhrase || 'unknown');
        };
        this.onSessionTerminated = () => {
            var _a;
            this.session = undefined;
            this.muted = false;
            this.held = false;
            (_a = this.remoteStream) === null || _a === void 0 ? void 0 : _a.clear();
            this.emit('callterminated');
            this.emit('stateChanged');
        };
        this.onNetworkRestored = () => {
            this.online = true;
            this.networkEmitter.emit('localnetworkonline');
            this.emit('stateChanged');
            this.attemptReconnection();
        };
        this.onNetworkLost = () => {
            this.online = false;
            this.networkEmitter.emit('localnetworkoffline');
            this.emit('stateChanged');
        };
        this.mediaStreamRendered = mediaRenderer;
        this.networkEmitter = new Emitter();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const { authPassword, authUserName, sipRegistrarHostnameOrIP, iceServers, webSocketURI } = this.config;
            const transportOptions = {
                server: webSocketURI,
                connectionTimeout: 100,
                keepAliveInterval: 20,
            };
            const sdpFactoryOptions = {
                iceGatheringTimeout: 10,
                peerConnectionConfiguration: { iceServers },
            };
            this.userAgent = new UserAgent({
                authorizationPassword: authPassword,
                authorizationUsername: authUserName,
                uri: UserAgent.makeURI(`sip:${authUserName}@${sipRegistrarHostnameOrIP}`),
                transportOptions,
                sessionDescriptionHandlerFactoryOptions: sdpFactoryOptions,
                logConfiguration: false,
                logLevel: 'error',
                delegate: {
                    onInvite: this.onIncomingCall,
                    onRefer: this.onTransferedCall,
                    onMessage: this.onMessageReceived,
                },
            });
            this.userAgent.transport.isConnected();
            try {
                this.registerer = new Registerer(this.userAgent);
                this.userAgent.transport.onConnect = this.onUserAgentConnected;
                this.userAgent.transport.onDisconnect = this.onUserAgentDisconnected;
                yield this.userAgent.start();
                window.addEventListener('online', this.onNetworkRestored);
                window.addEventListener('offline', this.onNetworkLost);
            }
            catch (error) {
                throw error;
            }
        });
    }
    static create(config, mediaRenderer) {
        return __awaiter(this, void 0, void 0, function* () {
            const voip = new VoipClient(config, mediaRenderer);
            yield voip.init();
            return voip;
        });
    }
    initSession(session) {
        var _a;
        this.session = session;
        this.updateContactInfoFromSession(session);
        (_a = this.session) === null || _a === void 0 ? void 0 : _a.stateChange.addListener((state) => {
            if (this.session !== session) {
                return; // if our session has changed, just return
            }
            const sessionEvents = {
                [SessionState.Initial]: () => undefined, // noop
                [SessionState.Establishing]: this.onSessionStablishing,
                [SessionState.Established]: this.onSessionStablished,
                [SessionState.Terminating]: this.onSessionTerminated,
                [SessionState.Terminated]: this.onSessionTerminated,
            };
            const event = sessionEvents[state];
            if (!event) {
                throw new Error('Unknown session state.');
            }
            event();
        });
    }
    attemptReconnection() {
        return __awaiter(this, arguments, void 0, function* (reconnectionAttempt = 0, checkRegistration = false) {
            const { connectionRetryCount } = this.config;
            if (!this.userAgent) {
                return;
            }
            if (connectionRetryCount !== -1 && reconnectionAttempt > connectionRetryCount) {
                return;
            }
            const reconnectionDelay = Math.pow(2, reconnectionAttempt % 4);
            console.error(`Attempting to reconnect with backoff due to network loss. Backoff time [${reconnectionDelay}]`);
            setTimeout(() => {
                var _a;
                (_a = this.userAgent) === null || _a === void 0 ? void 0 : _a.reconnect().catch(() => {
                    this.attemptReconnection(++reconnectionAttempt, checkRegistration);
                });
            }, reconnectionDelay * 1000);
        });
    }
    changeAudioInputDevice(constraints) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.session) {
                console.warn('changeAudioInputDevice() : No session.');
                return false;
            }
            const newStream = yield LocalStream.requestNewStream(constraints, this.session);
            if (!newStream) {
                console.warn('changeAudioInputDevice() : Unable to get local stream.');
                return false;
            }
            const { peerConnection } = this.sessionDescriptionHandler;
            if (!peerConnection) {
                console.warn('changeAudioInputDevice() : No peer connection.');
                return false;
            }
            LocalStream.replaceTrack(peerConnection, newStream, 'audio');
            return true;
        });
    }
    switchMediaRenderer(mediaRenderer) {
        if (!this.remoteStream) {
            return;
        }
        this.mediaStreamRendered = mediaRenderer;
        this.remoteStream.init(mediaRenderer.remoteMediaElement);
        this.remoteStream.play();
    }
    setContactInfo(contact) {
        this.contactInfo = contact;
        this.emit('stateChanged');
    }
    getContactInfo() {
        if (this.error) {
            return this.error.contact;
        }
        if (!(this.session instanceof Invitation) && !(this.session instanceof Inviter)) {
            return null;
        }
        return this.contactInfo;
    }
    getReferredBy() {
        var _a;
        if (!(this.session instanceof Invitation)) {
            return null;
        }
        const referredBy = this.session.request.getHeader('Referred-By');
        if (!referredBy) {
            return null;
        }
        const uri = UserAgent.makeURI(referredBy.slice(1, -1));
        if (!uri) {
            return null;
        }
        return {
            id: (_a = uri.user) !== null && _a !== void 0 ? _a : '',
            host: uri.host,
        };
    }
    isRegistered() {
        var _a;
        return ((_a = this.registerer) === null || _a === void 0 ? void 0 : _a.state) === RegistererState.Registered;
    }
    isReady() {
        var _a;
        return ((_a = this.userAgent) === null || _a === void 0 ? void 0 : _a.state) === UserAgentState.Started;
    }
    isCaller() {
        return this.session instanceof Inviter;
    }
    isCallee() {
        return this.session instanceof Invitation;
    }
    isIncoming() {
        return this.getSessionType() === 'INCOMING';
    }
    isOngoing() {
        return this.getSessionType() === 'ONGOING';
    }
    isOutgoing() {
        return this.getSessionType() === 'OUTGOING';
    }
    isInCall() {
        return this.getSessionType() !== null;
    }
    isError() {
        return !!this.error;
    }
    isOnline() {
        return this.online;
    }
    isMuted() {
        return this.muted;
    }
    isHeld() {
        return this.held;
    }
    getError() {
        var _a;
        return (_a = this.error) !== null && _a !== void 0 ? _a : null;
    }
    getSessionType() {
        var _a;
        if (this.error) {
            return 'ERROR';
        }
        if (((_a = this.session) === null || _a === void 0 ? void 0 : _a.state) === SessionState.Established) {
            return 'ONGOING';
        }
        if (this.session instanceof Invitation) {
            return 'INCOMING';
        }
        if (this.session instanceof Inviter) {
            return 'OUTGOING';
        }
        return null;
    }
    getSession() {
        const type = this.getSessionType();
        switch (type) {
            case 'ERROR': {
                const _a = this.getError(), { contact } = _a, error = __rest(_a, ["contact"]);
                return {
                    type: 'ERROR',
                    error,
                    contact,
                    end: this.clearErrors,
                };
            }
            case 'INCOMING':
            case 'ONGOING':
            case 'OUTGOING':
                return {
                    type,
                    contact: this.getContactInfo(),
                    transferedBy: this.getReferredBy(),
                    isMuted: this.isMuted(),
                    isHeld: this.isHeld(),
                    mute: this.setMute,
                    hold: this.setHold,
                    accept: this.answer,
                    end: this.endCall,
                    dtmf: this.sendDTMF,
                };
            default:
                return null;
        }
    }
    getState() {
        return {
            isRegistered: this.isRegistered(),
            isReady: this.isReady(),
            isOnline: this.isOnline(),
            isIncoming: this.isIncoming(),
            isOngoing: this.isOngoing(),
            isOutgoing: this.isOutgoing(),
            isInCall: this.isInCall(),
            isError: this.isError(),
        };
    }
    notifyDialer(value) {
        this.emit('dialer', value);
    }
    clear() {
        var _a, _b;
        (_a = this.userAgent) === null || _a === void 0 ? void 0 : _a.stop();
        (_b = this.registerer) === null || _b === void 0 ? void 0 : _b.dispose();
        if (this.userAgent) {
            this.userAgent.transport.onConnect = undefined;
            this.userAgent.transport.onDisconnect = undefined;
            window.removeEventListener('online', this.onNetworkRestored);
            window.removeEventListener('offline', this.onNetworkLost);
        }
    }
    setupRemoteMedia() {
        var _a;
        const { remoteMediaStream } = this.sessionDescriptionHandler;
        this.remoteStream = new RemoteStream(remoteMediaStream);
        const mediaElement = (_a = this.mediaStreamRendered) === null || _a === void 0 ? void 0 : _a.remoteMediaElement;
        if (mediaElement) {
            this.remoteStream.init(mediaElement);
            this.remoteStream.play();
        }
    }
    makeURI(calleeURI) {
        const hasPlusChar = calleeURI.includes('+');
        return UserAgent.makeURI(`sip:${hasPlusChar ? '*' : ''}${calleeURI}@${this.config.sipRegistrarHostnameOrIP}`);
    }
    toggleMediaStreamTracks(type, enable) {
        const { peerConnection } = this.sessionDescriptionHandler;
        if (!peerConnection) {
            throw new Error('Peer connection closed.');
        }
        const tracks = type === 'sender' ? peerConnection.getSenders() : peerConnection.getReceivers();
        tracks === null || tracks === void 0 ? void 0 : tracks.forEach((sender) => {
            if (sender.track) {
                sender.track.enabled = enable;
            }
        });
    }
    sendInvite(inviter) {
        return __awaiter(this, void 0, void 0, function* () {
            this.initSession(inviter);
            yield inviter.invite({
                requestDelegate: {
                    onReject: this.onInviteRejected,
                },
            });
            this.emit('stateChanged');
        });
    }
    updateContactInfoFromMessage(message) {
        var _a;
        const contentType = message.request.getHeader('Content-Type');
        const messageType = message.request.getHeader('X-Message-Type');
        try {
            if (messageType !== 'contactUpdate' || contentType !== 'application/json') {
                throw new Error('Failed to parse contact update message');
            }
            const data = JSON.parse(message.request.body);
            const uri = UserAgent.makeURI(data.uri);
            if (!uri) {
                throw new Error('Failed to parse contact update message');
            }
            this.setContactInfo({
                id: (_a = uri.user) !== null && _a !== void 0 ? _a : '',
                host: uri.host,
                name: uri.user,
            });
        }
        catch (e) {
            const error = e;
            console.warn(error.message);
        }
    }
    updateContactInfoFromSession(session) {
        var _a;
        if (!session) {
            return;
        }
        const { remoteIdentity } = session;
        this.setContactInfo({
            id: (_a = remoteIdentity.uri.user) !== null && _a !== void 0 ? _a : '',
            name: remoteIdentity.displayName,
            host: remoteIdentity.uri.host,
        });
    }
    sendContactUpdateMessage(contactURI) {
        if (!this.session) {
            return;
        }
        this.session.message({
            requestOptions: {
                extraHeaders: ['X-Message-Type: contactUpdate'],
                body: {
                    contentDisposition: 'render',
                    contentType: 'application/json',
                    content: JSON.stringify({ uri: contactURI.toString() }),
                },
            },
        });
    }
    get sessionDescriptionHandler() {
        if (!this.session) {
            throw new Error('No active call.');
        }
        const { sessionDescriptionHandler } = this.session;
        if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
            throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
        }
        return sessionDescriptionHandler;
    }
    setError(error) {
        this.error = error;
        this.emit('stateChanged');
    }
}
module.exportDefault(VoipClient);
//# sourceMappingURL=VoipClient.js.map