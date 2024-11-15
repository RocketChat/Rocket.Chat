module.export({SessionManager:()=>SessionManager});let Invitation;module.link("../../../api/invitation.js",{Invitation(v){Invitation=v}},0);let Inviter;module.link("../../../api/inviter.js",{Inviter(v){Inviter=v}},1);let Messager;module.link("../../../api/messager.js",{Messager(v){Messager=v}},2);let Registerer;module.link("../../../api/registerer.js",{Registerer(v){Registerer=v}},3);let RegistererState;module.link("../../../api/registerer-state.js",{RegistererState(v){RegistererState=v}},4);let RequestPendingError;module.link("../../../api/exceptions/request-pending.js",{RequestPendingError(v){RequestPendingError=v}},5);let Session;module.link("../../../api/session.js",{Session(v){Session=v}},6);let SessionState;module.link("../../../api/session-state.js",{SessionState(v){SessionState=v}},7);let UserAgent;module.link("../../../api/user-agent.js",{UserAgent(v){UserAgent=v}},8);let UserAgentState;module.link("../../../api/user-agent-state.js",{UserAgentState(v){UserAgentState=v}},9);let SessionDescriptionHandler;module.link("../session-description-handler/session-description-handler.js",{SessionDescriptionHandler(v){SessionDescriptionHandler=v}},10);let Transport;module.link("../transport/transport.js",{Transport(v){Transport=v}},11);let defaultManagedSessionFactory;module.link("./managed-session-factory-default.js",{defaultManagedSessionFactory(v){defaultManagedSessionFactory=v}},12);












/**
 * A session manager for SIP.js sessions.
 * @public
 */
class SessionManager {
    /**
     * Constructs a new instance of the `SessionManager` class.
     * @param server - SIP WebSocket Server URL.
     * @param options - Options bucket. See {@link SessionManagerOptions} for details.
     */
    constructor(server, options = {}) {
        /** Sessions being managed. */
        this.managedSessions = [];
        this.attemptingReconnection = false;
        this.optionsPingFailure = false;
        this.optionsPingRunning = false;
        this.shouldBeConnected = false;
        this.shouldBeRegistered = false;
        // Delegate
        this.delegate = options.delegate;
        // Copy options
        this.options = Object.assign({
            aor: "",
            autoStop: true,
            delegate: {},
            iceStopWaitingOnServerReflexive: false,
            managedSessionFactory: defaultManagedSessionFactory(),
            maxSimultaneousSessions: 2,
            media: {},
            optionsPingInterval: -1,
            optionsPingRequestURI: "",
            reconnectionAttempts: 3,
            reconnectionDelay: 4,
            registrationRetry: false,
            registrationRetryInterval: 3,
            registerGuard: null,
            registererOptions: {},
            registererRegisterOptions: {},
            sendDTMFUsingSessionDescriptionHandler: false,
            userAgentOptions: {}
        }, SessionManager.stripUndefinedProperties(options));
        // UserAgentOptions
        const userAgentOptions = Object.assign({}, options.userAgentOptions);
        // Transport
        if (!userAgentOptions.transportConstructor) {
            userAgentOptions.transportConstructor = Transport;
        }
        // TransportOptions
        if (!userAgentOptions.transportOptions) {
            userAgentOptions.transportOptions = {
                server
            };
        }
        // URI
        if (!userAgentOptions.uri) {
            // If an AOR was provided, convert it to a URI
            if (options.aor) {
                const uri = UserAgent.makeURI(options.aor);
                if (!uri) {
                    throw new Error(`Failed to create valid URI from ${options.aor}`);
                }
                userAgentOptions.uri = uri;
            }
        }
        // UserAgent
        this.userAgent = new UserAgent(userAgentOptions);
        // UserAgent's delegate
        this.userAgent.delegate = {
            // Handle connection with server established
            onConnect: () => {
                this.logger.log(`Connected`);
                if (this.delegate && this.delegate.onServerConnect) {
                    this.delegate.onServerConnect();
                }
                // Attempt to register if we are supposed to be registered
                if (this.shouldBeRegistered) {
                    this.register();
                }
                // Start OPTIONS pings if we are to be pinging
                if (this.options.optionsPingInterval > 0) {
                    this.optionsPingStart();
                }
            },
            // Handle connection with server lost
            onDisconnect: async (error) => {
                this.logger.log(`Disconnected`);
                // Stop OPTIONS ping if need be.
                let optionsPingFailure = false;
                if (this.options.optionsPingInterval > 0) {
                    optionsPingFailure = this.optionsPingFailure;
                    this.optionsPingFailure = false;
                    this.optionsPingStop();
                }
                // Let delgate know we have disconnected
                if (this.delegate && this.delegate.onServerDisconnect) {
                    this.delegate.onServerDisconnect(error);
                }
                // If the user called `disconnect` a graceful cleanup will be done therein.
                // Only cleanup if network/server dropped the connection.
                // Only reconnect if network/server dropped the connection
                if (error || optionsPingFailure) {
                    // There is no transport at this point, so we are not expecting to be able to
                    // send messages much less get responses. So just dispose of everything without
                    // waiting for anything to succeed.
                    if (this.registerer) {
                        this.logger.log(`Disposing of registerer...`);
                        this.registerer.dispose().catch((e) => {
                            this.logger.debug(`Error occurred disposing of registerer after connection with server was lost.`);
                            this.logger.debug(e.toString());
                        });
                        this.registerer = undefined;
                    }
                    this.managedSessions
                        .slice()
                        .map((el) => el.session)
                        .forEach(async (session) => {
                        this.logger.log(`Disposing of session...`);
                        session.dispose().catch((e) => {
                            this.logger.debug(`Error occurred disposing of a session after connection with server was lost.`);
                            this.logger.debug(e.toString());
                        });
                    });
                    // Attempt to reconnect if we are supposed to be connected.
                    if (this.shouldBeConnected) {
                        this.attemptReconnection();
                    }
                }
            },
            // Handle incoming invitations
            onInvite: (invitation) => {
                this.logger.log(`[${invitation.id}] Received INVITE`);
                // Guard against a maximum number of pre-existing sessions.
                // An incoming INVITE request may be received at any time and/or while in the process
                // of sending an outgoing INVITE request. So we reject any incoming INVITE in those cases.
                const maxSessions = this.options.maxSimultaneousSessions;
                if (maxSessions !== 0 && this.managedSessions.length > maxSessions) {
                    this.logger.warn(`[${invitation.id}] Session already in progress, rejecting INVITE...`);
                    invitation
                        .reject()
                        .then(() => {
                        this.logger.log(`[${invitation.id}] Rejected INVITE`);
                    })
                        .catch((error) => {
                        this.logger.error(`[${invitation.id}] Failed to reject INVITE`);
                        this.logger.error(error.toString());
                    });
                    return;
                }
                // Use our configured constraints as options for any Inviter created as result of a REFER
                const referralInviterOptions = {
                    sessionDescriptionHandlerOptions: { constraints: this.constraints }
                };
                // Initialize our session
                this.initSession(invitation, referralInviterOptions);
                // Delegate
                if (this.delegate && this.delegate.onCallReceived) {
                    this.delegate.onCallReceived(invitation);
                }
                else {
                    this.logger.warn(`[${invitation.id}] No handler available, rejecting INVITE...`);
                    invitation
                        .reject()
                        .then(() => {
                        this.logger.log(`[${invitation.id}] Rejected INVITE`);
                    })
                        .catch((error) => {
                        this.logger.error(`[${invitation.id}] Failed to reject INVITE`);
                        this.logger.error(error.toString());
                    });
                }
            },
            // Handle incoming messages
            onMessage: (message) => {
                message.accept().then(() => {
                    if (this.delegate && this.delegate.onMessageReceived) {
                        this.delegate.onMessageReceived(message);
                    }
                });
            },
            // Handle incoming notifications
            onNotify: (notification) => {
                notification.accept().then(() => {
                    if (this.delegate && this.delegate.onNotificationReceived) {
                        this.delegate.onNotificationReceived(notification);
                    }
                });
            }
        };
        // RegistererOptions
        this.registererOptions = Object.assign({}, options.registererOptions);
        // RegistererRegisterOptions
        this.registererRegisterOptions = Object.assign({}, options.registererRegisterOptions);
        // Retry registration on failure or rejection.
        if (this.options.registrationRetry) {
            // If the register request is rejected, try again...
            this.registererRegisterOptions.requestDelegate = this.registererRegisterOptions.requestDelegate || {};
            const existingOnReject = this.registererRegisterOptions.requestDelegate.onReject;
            this.registererRegisterOptions.requestDelegate.onReject = (response) => {
                existingOnReject && existingOnReject(response);
                // If at first we don't succeed, try try again...
                this.attemptRegistration();
            };
        }
        // Use the SIP.js logger
        this.logger = this.userAgent.getLogger("sip.SessionManager");
        // Monitor network connectivity and attempt reconnection and reregistration when we come online
        window.addEventListener("online", () => {
            this.logger.log(`Online`);
            if (this.shouldBeConnected) {
                this.connect();
            }
        });
        // NOTE: The autoStop option does not currently work as one likley expects.
        //       This code is here because the "autoStop behavior" and this assoicated
        //       implemenation has been a recurring request. So instead of removing
        //       the implementation again (because it doesn't work) and then having
        //       to explain agian the issue over and over again to those who want it,
        //       we have included it here to break that cycle. The implementation is
        //       harmless and serves to provide an explaination for those interested.
        if (this.options.autoStop) {
            // Standard operation workflow will resume after this callback exits, meaning
            // that any asynchronous operations are likely not going to be finished, especially
            // if they are guaranteed to not be executed in the current tick (promises fall
            // under this category, they will never be resolved synchronously by design).
            window.addEventListener("beforeunload", async () => {
                this.shouldBeConnected = false;
                this.shouldBeRegistered = false;
                if (this.userAgent.state !== UserAgentState.Stopped) {
                    // The stop() method returns a promise which will not resolve before the page unloads.
                    await this.userAgent.stop();
                }
            });
        }
    }
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    static stripUndefinedProperties(options) {
        return Object.keys(options).reduce((object, key) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (options[key] !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                object[key] = options[key];
            }
            return object;
        }, {});
    }
    /**
     * The local media stream. Undefined if call not answered.
     * @param session - Session to get the media stream from.
     */
    getLocalMediaStream(session) {
        const sdh = session.sessionDescriptionHandler;
        if (!sdh) {
            return undefined;
        }
        if (!(sdh instanceof SessionDescriptionHandler)) {
            throw new Error("Session description handler not instance of web SessionDescriptionHandler");
        }
        return sdh.localMediaStream;
    }
    /**
     * The remote media stream. Undefined if call not answered.
     * @param session - Session to get the media stream from.
     */
    getRemoteMediaStream(session) {
        const sdh = session.sessionDescriptionHandler;
        if (!sdh) {
            return undefined;
        }
        if (!(sdh instanceof SessionDescriptionHandler)) {
            throw new Error("Session description handler not instance of web SessionDescriptionHandler");
        }
        return sdh.remoteMediaStream;
    }
    /**
     * The local audio track, if available.
     * @param session - Session to get track from.
     * @deprecated Use localMediaStream and get track from the stream.
     */
    getLocalAudioTrack(session) {
        var _a;
        return (_a = this.getLocalMediaStream(session)) === null || _a === void 0 ? void 0 : _a.getTracks().find((track) => track.kind === "audio");
    }
    /**
     * The local video track, if available.
     * @param session - Session to get track from.
     * @deprecated Use localMediaStream and get track from the stream.
     */
    getLocalVideoTrack(session) {
        var _a;
        return (_a = this.getLocalMediaStream(session)) === null || _a === void 0 ? void 0 : _a.getTracks().find((track) => track.kind === "video");
    }
    /**
     * The remote audio track, if available.
     * @param session - Session to get track from.
     * @deprecated Use remoteMediaStream and get track from the stream.
     */
    getRemoteAudioTrack(session) {
        var _a;
        return (_a = this.getRemoteMediaStream(session)) === null || _a === void 0 ? void 0 : _a.getTracks().find((track) => track.kind === "audio");
    }
    /**
     * The remote video track, if available.
     * @param session - Session to get track from.
     * @deprecated Use remoteMediaStream and get track from the stream.
     */
    getRemoteVideoTrack(session) {
        var _a;
        return (_a = this.getRemoteMediaStream(session)) === null || _a === void 0 ? void 0 : _a.getTracks().find((track) => track.kind === "video");
    }
    /**
     * Connect.
     * @remarks
     * If not started, starts the UserAgent connecting the WebSocket Transport.
     * Otherwise reconnects the UserAgent's WebSocket Transport.
     * Attempts will be made to reconnect as needed.
     */
    async connect() {
        this.logger.log(`Connecting UserAgent...`);
        this.shouldBeConnected = true;
        if (this.userAgent.state !== UserAgentState.Started) {
            return this.userAgent.start();
        }
        return this.userAgent.reconnect();
    }
    /**
     * Disconnect.
     * @remarks
     * If not stopped, stops the UserAgent disconnecting the WebSocket Transport.
     */
    async disconnect() {
        this.logger.log(`Disconnecting UserAgent...`);
        if (this.userAgent.state === UserAgentState.Stopped) {
            return Promise.resolve();
        }
        this.shouldBeConnected = false;
        this.shouldBeRegistered = false;
        this.registerer = undefined;
        return this.userAgent.stop();
    }
    /**
     * Return true if transport is connected.
     */
    isConnected() {
        return this.userAgent.isConnected();
    }
    /**
     * Start receiving incoming calls.
     * @remarks
     * Send a REGISTER request for the UserAgent's AOR.
     * Resolves when the REGISTER request is sent, otherwise rejects.
     * Attempts will be made to re-register as needed.
     */
    async register(registererRegisterOptions) {
        this.logger.log(`Registering UserAgent...`);
        this.shouldBeRegistered = true;
        if (registererRegisterOptions !== undefined) {
            this.registererRegisterOptions = Object.assign({}, registererRegisterOptions);
        }
        if (!this.registerer) {
            this.registerer = new Registerer(this.userAgent, this.registererOptions);
            this.registerer.stateChange.addListener((state) => {
                switch (state) {
                    case RegistererState.Initial:
                        break;
                    case RegistererState.Registered:
                        if (this.delegate && this.delegate.onRegistered) {
                            this.delegate.onRegistered();
                        }
                        break;
                    case RegistererState.Unregistered:
                        if (this.delegate && this.delegate.onUnregistered) {
                            this.delegate.onUnregistered();
                        }
                        // If we transition to an unregister state, attempt to get back to a registered state.
                        if (this.shouldBeRegistered) {
                            this.attemptRegistration();
                        }
                        break;
                    case RegistererState.Terminated:
                        break;
                    default:
                        throw new Error("Unknown registerer state.");
                }
            });
        }
        return this.attemptRegistration(true);
    }
    /**
     * Stop receiving incoming calls.
     * @remarks
     * Send an un-REGISTER request for the UserAgent's AOR.
     * Resolves when the un-REGISTER request is sent, otherwise rejects.
     */
    async unregister(registererUnregisterOptions) {
        this.logger.log(`Unregistering UserAgent...`);
        this.shouldBeRegistered = false;
        if (!this.registerer) {
            this.logger.warn(`No registerer to unregister.`);
            return Promise.resolve();
        }
        return this.registerer.unregister(registererUnregisterOptions).then(() => {
            return;
        });
    }
    /**
     * Make an outgoing call.
     * @remarks
     * Send an INVITE request to create a new Session.
     * Resolves when the INVITE request is sent, otherwise rejects.
     * Use `onCallAnswered` delegate method to determine if Session is established.
     * @param destination - The target destination to call. A SIP address to send the INVITE to.
     * @param inviterOptions - Optional options for Inviter constructor.
     * @param inviterInviteOptions - Optional options for Inviter.invite().
     */
    async call(destination, inviterOptions, inviterInviteOptions) {
        this.logger.log(`Beginning Session...`);
        // Guard against a maximum number of pre-existing sessions.
        // An incoming INVITE request may be received at any time and/or while in the process
        // of sending an outgoing INVITE request. So we reject any incoming INVITE in those cases.
        const maxSessions = this.options.maxSimultaneousSessions;
        if (maxSessions !== 0 && this.managedSessions.length > maxSessions) {
            return Promise.reject(new Error("Maximum number of sessions already exists."));
        }
        const target = UserAgent.makeURI(destination);
        if (!target) {
            return Promise.reject(new Error(`Failed to create a valid URI from "${destination}"`));
        }
        // Use our configured constraints as InviterOptions if none provided
        if (!inviterOptions) {
            inviterOptions = {};
        }
        if (!inviterOptions.sessionDescriptionHandlerOptions) {
            inviterOptions.sessionDescriptionHandlerOptions = {};
        }
        if (!inviterOptions.sessionDescriptionHandlerOptions.constraints) {
            inviterOptions.sessionDescriptionHandlerOptions.constraints = this.constraints;
        }
        // If utilizing early media, add a handler to catch 183 Session Progress
        // messages and then to play the associated remote media (the early media).
        if (inviterOptions.earlyMedia) {
            inviterInviteOptions = inviterInviteOptions || {};
            inviterInviteOptions.requestDelegate = inviterInviteOptions.requestDelegate || {};
            const existingOnProgress = inviterInviteOptions.requestDelegate.onProgress;
            inviterInviteOptions.requestDelegate.onProgress = (response) => {
                if (response.message.statusCode === 183) {
                    this.setupRemoteMedia(inviter);
                }
                existingOnProgress && existingOnProgress(response);
            };
        }
        // TODO: Any existing onSessionDescriptionHandler is getting clobbered here.
        // If we get a server reflexive candidate, stop waiting on ICE gathering to complete.
        // The candidate is a server reflexive candidate; the ip indicates an intermediary
        // address assigned by the STUN server to represent the candidate's peer anonymously.
        if (this.options.iceStopWaitingOnServerReflexive) {
            inviterOptions.delegate = inviterOptions.delegate || {};
            inviterOptions.delegate.onSessionDescriptionHandler = (sessionDescriptionHandler) => {
                if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
                    throw new Error("Session description handler not instance of SessionDescriptionHandler");
                }
                sessionDescriptionHandler.peerConnectionDelegate = {
                    onicecandidate: (event) => {
                        var _a;
                        if (((_a = event.candidate) === null || _a === void 0 ? void 0 : _a.type) === "srflx") {
                            this.logger.log(`[${inviter.id}] Found srflx ICE candidate, stop waiting...`);
                            // In sip.js > 0.20.1 this cast should be removed as iceGatheringComplete will be public
                            const sdh = sessionDescriptionHandler;
                            sdh.iceGatheringComplete();
                        }
                    }
                };
            };
        }
        // Create a new Inviter for the outgoing Session
        const inviter = new Inviter(this.userAgent, target, inviterOptions);
        // Send INVITE
        return this.sendInvite(inviter, inviterOptions, inviterInviteOptions).then(() => {
            return inviter;
        });
    }
    /**
     * Hangup a call.
     * @param session - Session to hangup.
     * @remarks
     * Send a BYE request, CANCEL request or reject response to end the current Session.
     * Resolves when the request/response is sent, otherwise rejects.
     * Use `onCallHangup` delegate method to determine if and when call is ended.
     */
    async hangup(session) {
        this.logger.log(`[${session.id}] Hangup...`);
        if (!this.sessionExists(session)) {
            return Promise.reject(new Error("Session does not exist."));
        }
        return this.terminate(session);
    }
    /**
     * Answer an incoming call.
     * @param session - Session to answer.
     * @remarks
     * Accept an incoming INVITE request creating a new Session.
     * Resolves with the response is sent, otherwise rejects.
     * Use `onCallAnswered` delegate method to determine if and when call is established.
     * @param invitationAcceptOptions - Optional options for Inviter.accept().
     */
    async answer(session, invitationAcceptOptions) {
        this.logger.log(`[${session.id}] Accepting Invitation...`);
        if (!this.sessionExists(session)) {
            return Promise.reject(new Error("Session does not exist."));
        }
        if (!(session instanceof Invitation)) {
            return Promise.reject(new Error("Session not instance of Invitation."));
        }
        // Use our configured constraints as InvitationAcceptOptions if none provided
        if (!invitationAcceptOptions) {
            invitationAcceptOptions = {};
        }
        if (!invitationAcceptOptions.sessionDescriptionHandlerOptions) {
            invitationAcceptOptions.sessionDescriptionHandlerOptions = {};
        }
        if (!invitationAcceptOptions.sessionDescriptionHandlerOptions.constraints) {
            invitationAcceptOptions.sessionDescriptionHandlerOptions.constraints = this.constraints;
        }
        return session.accept(invitationAcceptOptions);
    }
    /**
     * Decline an incoming call.
     * @param session - Session to decline.
     * @remarks
     * Reject an incoming INVITE request.
     * Resolves with the response is sent, otherwise rejects.
     * Use `onCallHangup` delegate method to determine if and when call is ended.
     */
    async decline(session) {
        this.logger.log(`[${session.id}] Rejecting Invitation...`);
        if (!this.sessionExists(session)) {
            return Promise.reject(new Error("Session does not exist."));
        }
        if (!(session instanceof Invitation)) {
            return Promise.reject(new Error("Session not instance of Invitation."));
        }
        return session.reject();
    }
    /**
     * Hold call
     * @param session - Session to hold.
     * @remarks
     * Send a re-INVITE with new offer indicating "hold".
     * Resolves when the re-INVITE request is sent, otherwise rejects.
     * Use `onCallHold` delegate method to determine if request is accepted or rejected.
     * See: https://tools.ietf.org/html/rfc6337
     */
    async hold(session) {
        this.logger.log(`[${session.id}] Holding session...`);
        return this.setHold(session, true);
    }
    /**
     * Unhold call.
     * @param session - Session to unhold.
     * @remarks
     * Send a re-INVITE with new offer indicating "unhold".
     * Resolves when the re-INVITE request is sent, otherwise rejects.
     * Use `onCallHold` delegate method to determine if request is accepted or rejected.
     * See: https://tools.ietf.org/html/rfc6337
     */
    async unhold(session) {
        this.logger.log(`[${session.id}] Unholding session...`);
        return this.setHold(session, false);
    }
    /**
     * Hold state.
     * @param session - Session to check.
     * @remarks
     * True if session is on hold.
     */
    isHeld(session) {
        const managedSession = this.sessionManaged(session);
        return managedSession ? managedSession.held : false;
    }
    /**
     * Mute call.
     * @param session - Session to mute.
     * @remarks
     * Disable sender's media tracks.
     */
    mute(session) {
        this.logger.log(`[${session.id}] Disabling media tracks...`);
        this.setMute(session, true);
    }
    /**
     * Unmute call.
     * @param session - Session to unmute.
     * @remarks
     * Enable sender's media tracks.
     */
    unmute(session) {
        this.logger.log(`[${session.id}] Enabling media tracks...`);
        this.setMute(session, false);
    }
    /**
     * Mute state.
     * @param session - Session to check.
     * @remarks
     * True if sender's media track is disabled.
     */
    isMuted(session) {
        const managedSession = this.sessionManaged(session);
        return managedSession ? managedSession.muted : false;
    }
    /**
     * Send DTMF.
     * @param session - Session to send on.
     * @remarks
     * Send an INFO request with content type application/dtmf-relay.
     * @param tone - Tone to send.
     */
    async sendDTMF(session, tone) {
        this.logger.log(`[${session.id}] Sending DTMF...`);
        // Validate tone
        if (!/^[0-9A-D#*,]$/.exec(tone)) {
            return Promise.reject(new Error("Invalid DTMF tone."));
        }
        if (!this.sessionExists(session)) {
            return Promise.reject(new Error("Session does not exist."));
        }
        this.logger.log(`[${session.id}] Sending DTMF tone: ${tone}`);
        if (this.options.sendDTMFUsingSessionDescriptionHandler) {
            if (!session.sessionDescriptionHandler) {
                return Promise.reject(new Error("Session desciption handler undefined."));
            }
            if (!session.sessionDescriptionHandler.sendDtmf(tone)) {
                return Promise.reject(new Error("Failed to send DTMF"));
            }
            return Promise.resolve();
        }
        else {
            // As RFC 6086 states, sending DTMF via INFO is not standardized...
            //
            // Companies have been using INFO messages in order to transport
            // Dual-Tone Multi-Frequency (DTMF) tones.  All mechanisms are
            // proprietary and have not been standardized.
            // https://tools.ietf.org/html/rfc6086#section-2
            //
            // It is however widely supported based on this draft:
            // https://tools.ietf.org/html/draft-kaplan-dispatch-info-dtmf-package-00
            // The UA MUST populate the "application/dtmf-relay" body, as defined
            // earlier, with the button pressed and the duration it was pressed
            // for.  Technically, this actually requires the INFO to be generated
            // when the user *releases* the button, however if the user has still
            // not released a button after 5 seconds, which is the maximum duration
            // supported by this mechanism, the UA should generate the INFO at that
            // time.
            // https://tools.ietf.org/html/draft-kaplan-dispatch-info-dtmf-package-00#section-5.3
            const dtmf = tone;
            const duration = 2000;
            const body = {
                contentDisposition: "render",
                contentType: "application/dtmf-relay",
                content: "Signal=" + dtmf + "\r\nDuration=" + duration
            };
            const requestOptions = { body };
            return session.info({ requestOptions }).then(() => {
                return;
            });
        }
    }
    /**
     * Transfer.
     * @param session - Session with the transferee to transfer.
     * @param target - The referral target.
     * @remarks
     * If target is a Session this is an attended transfer completion (REFER with Replaces),
     * otherwise this is a blind transfer (REFER). Attempting an attended transfer
     * completion on a call that has not been answered will be rejected. To implement
     * an attended transfer with early completion, hangup the call with the target
     * and execute a blind transfer to the target.
     */
    async transfer(session, target, options) {
        this.logger.log(`[${session.id}] Referring session...`);
        if (target instanceof Session) {
            return session.refer(target, options).then(() => {
                return;
            });
        }
        const uri = UserAgent.makeURI(target);
        if (!uri) {
            return Promise.reject(new Error(`Failed to create a valid URI from "${target}"`));
        }
        return session.refer(uri, options).then(() => {
            return;
        });
    }
    /**
     * Send a message.
     * @remarks
     * Send a MESSAGE request.
     * @param destination - The target destination for the message. A SIP address to send the MESSAGE to.
     */
    async message(destination, message) {
        this.logger.log(`Sending message...`);
        const target = UserAgent.makeURI(destination);
        if (!target) {
            return Promise.reject(new Error(`Failed to create a valid URI from "${destination}"`));
        }
        return new Messager(this.userAgent, target, message).message();
    }
    /** Media constraints. */
    get constraints() {
        let constraints = { audio: true, video: false }; // default to audio only calls
        if (this.options.media.constraints) {
            constraints = Object.assign({}, this.options.media.constraints);
        }
        return constraints;
    }
    /**
     * Attempt reconnection up to `reconnectionAttempts` times.
     * @param reconnectionAttempt - Current attempt number.
     */
    attemptReconnection(reconnectionAttempt = 1) {
        const reconnectionAttempts = this.options.reconnectionAttempts;
        const reconnectionDelay = this.options.reconnectionDelay;
        if (!this.shouldBeConnected) {
            this.logger.log(`Should not be connected currently`);
            return; // If intentionally disconnected, don't reconnect.
        }
        if (this.attemptingReconnection) {
            this.logger.log(`Reconnection attempt already in progress`);
        }
        if (reconnectionAttempt > reconnectionAttempts) {
            this.logger.log(`Reconnection maximum attempts reached`);
            return;
        }
        if (reconnectionAttempt === 1) {
            this.logger.log(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying`);
        }
        else {
            this.logger.log(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying in ${reconnectionDelay} seconds`);
        }
        this.attemptingReconnection = true;
        setTimeout(() => {
            if (!this.shouldBeConnected) {
                this.logger.log(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - aborted`);
                this.attemptingReconnection = false;
                return; // If intentionally disconnected, don't reconnect.
            }
            this.userAgent
                .reconnect()
                .then(() => {
                this.logger.log(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - succeeded`);
                this.attemptingReconnection = false;
            })
                .catch((error) => {
                this.logger.log(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - failed`);
                this.logger.error(error.message);
                this.attemptingReconnection = false;
                this.attemptReconnection(++reconnectionAttempt);
            });
        }, reconnectionAttempt === 1 ? 0 : reconnectionDelay * 1000);
    }
    /**
     * Register to receive calls.
     * @param withoutDelay - If true attempt immediately, otherwise wait `registrationRetryInterval`.
     */
    attemptRegistration(withoutDelay = false) {
        this.logger.log(`Registration attempt ${withoutDelay ? "without delay" : ""}`);
        if (!this.shouldBeRegistered) {
            this.logger.log(`Should not be registered currently`);
            return Promise.resolve();
        }
        // It only makes sense to have one attempt in progress at a time.
        // Perhaps we shall (or should) try once again.
        if (this.registrationAttemptTimeout !== undefined) {
            this.logger.log(`Registration attempt already in progress`);
            return Promise.resolve();
        }
        // Helper function to send the register request.
        const _register = () => {
            // If we do not have a registerer, it is not worth trying to register.
            if (!this.registerer) {
                this.logger.log(`Registerer undefined`);
                return Promise.resolve();
            }
            // If the WebSocket transport is not connected, it is not worth trying to register.
            // Perhpas we shall (or should) try once we are connected.
            if (!this.isConnected()) {
                this.logger.log(`User agent not connected`);
                return Promise.resolve();
            }
            // If the UserAgent is stopped, it is not worth trying to register.
            // Perhaps we shall (or should) try once the UserAgent is running.
            if (this.userAgent.state === UserAgentState.Stopped) {
                this.logger.log(`User agent stopped`);
                return Promise.resolve();
            }
            // If no guard defined, we are good to proceed without any further ado.
            if (!this.options.registerGuard) {
                return this.registerer.register(this.registererRegisterOptions).then(() => {
                    return;
                });
            }
            // Otherwise check to make sure the guard does not want us halt.
            return this.options
                .registerGuard()
                .catch((error) => {
                this.logger.log(`Register guard rejected will making registration attempt`);
                throw error;
            })
                .then((halt) => {
                if (halt || !this.registerer) {
                    return Promise.resolve();
                }
                return this.registerer.register(this.registererRegisterOptions).then(() => {
                    return;
                });
            });
        };
        // Compute an amount of time in seconds to wait before sending another register request.
        // This is a small attempt to avoid DOS attacking our own backend in the event that a
        // relatively large number of clients sychonously keep retrying register reqeusts.
        // This is known to happen when the backend goes down for a period and all clients
        // are attempting to register again - the backend gets slammed with synced reqeusts.
        const computeRegistrationTimeout = (lowerBound) => {
            const upperBound = lowerBound * 2;
            return 1000 * (Math.random() * (upperBound - lowerBound) + lowerBound);
        };
        // Send register request after a delay
        return new Promise((resolve, reject) => {
            this.registrationAttemptTimeout = setTimeout(() => {
                _register()
                    .then(() => {
                    this.registrationAttemptTimeout = undefined;
                    resolve();
                })
                    .catch((error) => {
                    this.registrationAttemptTimeout = undefined;
                    if (error instanceof RequestPendingError) {
                        resolve();
                    }
                    else {
                        reject(error);
                    }
                });
            }, withoutDelay ? 0 : computeRegistrationTimeout(this.options.registrationRetryInterval));
        });
    }
    /** Helper function to remove media from html elements. */
    cleanupMedia(session) {
        const managedSession = this.sessionManaged(session);
        if (!managedSession) {
            throw new Error("Managed session does not exist.");
        }
        if (managedSession.mediaLocal) {
            if (managedSession.mediaLocal.video) {
                managedSession.mediaLocal.video.srcObject = null;
                managedSession.mediaLocal.video.pause();
            }
        }
        if (managedSession.mediaRemote) {
            if (managedSession.mediaRemote.audio) {
                managedSession.mediaRemote.audio.srcObject = null;
                managedSession.mediaRemote.audio.pause();
            }
            if (managedSession.mediaRemote.video) {
                managedSession.mediaRemote.video.srcObject = null;
                managedSession.mediaRemote.video.pause();
            }
        }
    }
    /** Helper function to enable/disable media tracks. */
    enableReceiverTracks(session, enable) {
        if (!this.sessionExists(session)) {
            throw new Error("Session does not exist.");
        }
        const sessionDescriptionHandler = session.sessionDescriptionHandler;
        if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
            throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
        }
        sessionDescriptionHandler.enableReceiverTracks(enable);
    }
    /** Helper function to enable/disable media tracks. */
    enableSenderTracks(session, enable) {
        if (!this.sessionExists(session)) {
            throw new Error("Session does not exist.");
        }
        const sessionDescriptionHandler = session.sessionDescriptionHandler;
        if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
            throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
        }
        sessionDescriptionHandler.enableSenderTracks(enable);
    }
    /**
     * Setup session delegate and state change handler.
     * @param session - Session to setup.
     * @param referralInviterOptions - Options for any Inviter created as result of a REFER.
     */
    initSession(session, referralInviterOptions) {
        // Add the session
        this.sessionAdd(session);
        // Call session created callback
        if (this.delegate && this.delegate.onCallCreated) {
            this.delegate.onCallCreated(session);
        }
        // Setup session state change handler
        session.stateChange.addListener((state) => {
            this.logger.log(`[${session.id}] Session state changed to ${state}`);
            switch (state) {
                case SessionState.Initial:
                    break;
                case SessionState.Establishing:
                    break;
                case SessionState.Established:
                    this.setupLocalMedia(session);
                    this.setupRemoteMedia(session);
                    if (this.delegate && this.delegate.onCallAnswered) {
                        this.delegate.onCallAnswered(session);
                    }
                    break;
                case SessionState.Terminating:
                // fall through
                case SessionState.Terminated:
                    // This will already have executed if/when we fall
                    // through from Terminating and thus the managed
                    // session may already have been cleaned up.
                    if (this.sessionExists(session)) {
                        this.cleanupMedia(session);
                        this.sessionRemove(session);
                        if (this.delegate && this.delegate.onCallHangup) {
                            this.delegate.onCallHangup(session);
                        }
                    }
                    break;
                default:
                    throw new Error("Unknown session state.");
            }
        });
        // TODO: Any existing onInfo or onRefer delegate gets clobbered here.
        // Setup delegate
        session.delegate = session.delegate || {};
        session.delegate.onInfo = (info) => {
            // As RFC 6086 states, sending DTMF via INFO is not standardized...
            //
            // Companies have been using INFO messages in order to transport
            // Dual-Tone Multi-Frequency (DTMF) tones.  All mechanisms are
            // proprietary and have not been standardized.
            // https://tools.ietf.org/html/rfc6086#section-2
            //
            // It is however widely supported based on this draft:
            // https://tools.ietf.org/html/draft-kaplan-dispatch-info-dtmf-package-00
            var _a;
            // FIXME: TODO: We should reject correctly...
            //
            // If a UA receives an INFO request associated with an Info Package that
            // the UA has not indicated willingness to receive, the UA MUST send a
            // 469 (Bad Info Package) response (see Section 11.6), which contains a
            // Recv-Info header field with Info Packages for which the UA is willing
            // to receive INFO requests.
            // https://tools.ietf.org/html/rfc6086#section-4.2.2
            // No delegate
            if (((_a = this.delegate) === null || _a === void 0 ? void 0 : _a.onCallDTMFReceived) === undefined) {
                info.reject();
                return;
            }
            // Invalid content type
            const contentType = info.request.getHeader("content-type");
            if (!contentType || !/^application\/dtmf-relay/i.exec(contentType)) {
                info.reject();
                return;
            }
            // Invalid body
            const body = info.request.body.split("\r\n", 2);
            if (body.length !== 2) {
                info.reject();
                return;
            }
            // Invalid tone
            let tone;
            const toneRegExp = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/;
            if (body[0] !== undefined && toneRegExp.test(body[0])) {
                tone = body[0].replace(toneRegExp, "$2");
            }
            if (!tone) {
                info.reject();
                return;
            }
            // Invalid duration
            let duration;
            const durationRegExp = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;
            if (body[1] !== undefined && durationRegExp.test(body[1])) {
                duration = parseInt(body[1].replace(durationRegExp, "$2"), 10);
            }
            if (!duration) {
                info.reject();
                return;
            }
            info
                .accept()
                .then(() => {
                if (this.delegate && this.delegate.onCallDTMFReceived) {
                    if (!tone || !duration) {
                        throw new Error("Tone or duration undefined.");
                    }
                    this.delegate.onCallDTMFReceived(session, tone, duration);
                }
            })
                .catch((error) => {
                this.logger.error(error.message);
            });
        };
        session.delegate.onRefer = (referral) => {
            referral
                .accept()
                .then(() => this.sendInvite(referral.makeInviter(referralInviterOptions), referralInviterOptions))
                .catch((error) => {
                this.logger.error(error.message);
            });
        };
    }
    /**
     * Periodically send OPTIONS pings and disconnect when a ping fails.
     * @param requestURI - Request URI to target
     * @param fromURI - From URI
     * @param toURI - To URI
     */
    optionsPingRun(requestURI, fromURI, toURI) {
        // Guard against nvalid interval
        if (this.options.optionsPingInterval < 1) {
            throw new Error("Invalid options ping interval.");
        }
        // Guard against sending a ping when there is one outstanading
        if (this.optionsPingRunning) {
            return;
        }
        this.optionsPingRunning = true;
        // Setup next ping to run in future
        this.optionsPingTimeout = setTimeout(() => {
            this.optionsPingTimeout = undefined;
            // If ping succeeds...
            const onPingSuccess = () => {
                // record success or failure
                this.optionsPingFailure = false;
                // if we are still running, queue up the next ping
                if (this.optionsPingRunning) {
                    this.optionsPingRunning = false;
                    this.optionsPingRun(requestURI, fromURI, toURI);
                }
            };
            // If ping fails...
            const onPingFailure = () => {
                this.logger.error("OPTIONS ping failed");
                // record success or failure
                this.optionsPingFailure = true;
                // stop running
                this.optionsPingRunning = false;
                // disconnect the transport
                this.userAgent.transport.disconnect().catch((error) => this.logger.error(error));
            };
            // Create an OPTIONS request message
            const core = this.userAgent.userAgentCore;
            const message = core.makeOutgoingRequestMessage("OPTIONS", requestURI, fromURI, toURI, {});
            // Send the request message
            this.optionsPingRequest = core.request(message, {
                onAccept: () => {
                    this.optionsPingRequest = undefined;
                    onPingSuccess();
                },
                onReject: (response) => {
                    this.optionsPingRequest = undefined;
                    // Ping fails on following responses...
                    // - 408 Request Timeout (no response was received)
                    // - 503 Service Unavailable (a transport layer error occured)
                    if (response.message.statusCode === 408 || response.message.statusCode === 503) {
                        onPingFailure();
                    }
                    else {
                        onPingSuccess();
                    }
                }
            });
        }, this.options.optionsPingInterval * 1000);
    }
    /**
     * Start sending OPTIONS pings.
     */
    optionsPingStart() {
        this.logger.log(`OPTIONS pings started`);
        // Create the URIs needed to send OPTIONS pings
        let requestURI, fromURI, toURI;
        if (this.options.optionsPingRequestURI) {
            // Use whatever specific RURI is provided.
            requestURI = UserAgent.makeURI(this.options.optionsPingRequestURI);
            if (!requestURI) {
                throw new Error("Failed to create Request URI.");
            }
            // Use the user agent's contact URI for From and To URIs
            fromURI = this.userAgent.contact.uri.clone();
            toURI = this.userAgent.contact.uri.clone();
        }
        else if (this.options.aor) {
            // Otherwise use the AOR provided to target the assocated registrar server.
            const uri = UserAgent.makeURI(this.options.aor);
            if (!uri) {
                throw new Error("Failed to create URI.");
            }
            requestURI = uri.clone();
            requestURI.user = undefined; // target the registrar server
            fromURI = uri.clone();
            toURI = uri.clone();
        }
        else {
            this.logger.error("You have enabled sending OPTIONS pings and as such you must provide either " +
                "a) an AOR to register, or b) an RURI to use for the target of the OPTIONS ping requests. ");
            return;
        }
        // Send the OPTIONS pings
        this.optionsPingRun(requestURI, fromURI, toURI);
    }
    /**
     * Stop sending OPTIONS pings.
     */
    optionsPingStop() {
        this.logger.log(`OPTIONS pings stopped`);
        this.optionsPingRunning = false;
        this.optionsPingFailure = false;
        if (this.optionsPingRequest) {
            this.optionsPingRequest.dispose();
            this.optionsPingRequest = undefined;
        }
        if (this.optionsPingTimeout) {
            clearTimeout(this.optionsPingTimeout);
            this.optionsPingTimeout = undefined;
        }
    }
    /** Helper function to init send then send invite. */
    async sendInvite(inviter, inviterOptions, inviterInviteOptions) {
        // Initialize our session
        this.initSession(inviter, inviterOptions);
        // Send the INVITE
        return inviter.invite(inviterInviteOptions).then(() => {
            this.logger.log(`[${inviter.id}] Sent INVITE`);
        });
    }
    /** Helper function to add a session to the ones we are managing. */
    sessionAdd(session) {
        const managedSession = this.options.managedSessionFactory(this, session);
        this.managedSessions.push(managedSession);
    }
    /** Helper function to check if the session is one we are managing. */
    sessionExists(session) {
        return this.sessionManaged(session) !== undefined;
    }
    /** Helper function to check if the session is one we are managing. */
    sessionManaged(session) {
        return this.managedSessions.find((el) => el.session.id === session.id);
    }
    /** Helper function to remoce a session from the ones we are managing. */
    sessionRemove(session) {
        this.managedSessions = this.managedSessions.filter((el) => el.session.id !== session.id);
    }
    /**
     * Puts Session on hold.
     * @param session - The session to set.
     * @param hold - Hold on if true, off if false.
     */
    async setHold(session, hold) {
        if (!this.sessionExists(session)) {
            return Promise.reject(new Error("Session does not exist."));
        }
        // Just resolve if we are already in correct state
        if (this.isHeld(session) === hold) {
            return Promise.resolve();
        }
        const sessionDescriptionHandler = session.sessionDescriptionHandler;
        if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
            throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
        }
        const options = {
            requestDelegate: {
                onAccept: () => {
                    const managedSession = this.sessionManaged(session);
                    if (managedSession !== undefined) {
                        managedSession.held = hold;
                        this.enableReceiverTracks(session, !managedSession.held);
                        this.enableSenderTracks(session, !managedSession.held && !managedSession.muted);
                        if (this.delegate && this.delegate.onCallHold) {
                            this.delegate.onCallHold(session, managedSession.held);
                        }
                    }
                },
                onReject: () => {
                    this.logger.warn(`[${session.id}] Re-invite request was rejected`);
                    const managedSession = this.sessionManaged(session);
                    if (managedSession !== undefined) {
                        managedSession.held = !hold; // this was preemptively set so undo on failure
                        this.enableReceiverTracks(session, !managedSession.held);
                        this.enableSenderTracks(session, !managedSession.held && !managedSession.muted);
                        if (this.delegate && this.delegate.onCallHold) {
                            this.delegate.onCallHold(session, managedSession.held);
                        }
                    }
                }
            }
        };
        // Session properties used to pass options to the SessionDescriptionHandler:
        //
        // 1) Session.sessionDescriptionHandlerOptions
        //    SDH options for the initial INVITE transaction.
        //    - Used in all cases when handling the initial INVITE transaction as either UAC or UAS.
        //    - May be set directly at anytime.
        //    - May optionally be set via constructor option.
        //    - May optionally be set via options passed to Inviter.invite() or Invitation.accept().
        //
        // 2) Session.sessionDescriptionHandlerOptionsReInvite
        //    SDH options for re-INVITE transactions.
        //    - Used in all cases when handling a re-INVITE transaction as either UAC or UAS.
        //    - May be set directly at anytime.
        //    - May optionally be set via constructor option.
        //    - May optionally be set via options passed to Session.invite().
        const sessionDescriptionHandlerOptions = session.sessionDescriptionHandlerOptionsReInvite;
        sessionDescriptionHandlerOptions.hold = hold;
        session.sessionDescriptionHandlerOptionsReInvite = sessionDescriptionHandlerOptions;
        // Preemptively and optimistically set held state (but do not call delegate).
        const managedSession = this.sessionManaged(session);
        if (!managedSession) {
            throw new Error("Managed session is undefiend.");
        }
        managedSession.held = hold;
        // Send re-INVITE
        return session
            .invite(options)
            .then(() => {
            // Preemptively enable/disable tracks
            const managedSession = this.sessionManaged(session);
            if (managedSession !== undefined) {
                this.enableReceiverTracks(session, !managedSession.held);
                this.enableSenderTracks(session, !managedSession.held && !managedSession.muted);
            }
        })
            .catch((error) => {
            managedSession.held = !hold; // was preemptively set so undo on failure
            if (error instanceof RequestPendingError) {
                this.logger.error(`[${session.id}] A hold request is already in progress.`);
            }
            throw error;
        });
    }
    /**
     * Puts Session on mute.
     * @param session - The session to mute.
     * @param mute - Mute on if true, off if false.
     */
    setMute(session, mute) {
        if (!this.sessionExists(session)) {
            this.logger.warn(`[${session.id}] A session is required to enabled/disable media tracks`);
            return;
        }
        if (session.state !== SessionState.Established) {
            this.logger.warn(`[${session.id}] An established session is required to enable/disable media tracks`);
            return;
        }
        const managedSession = this.sessionManaged(session);
        if (managedSession !== undefined) {
            managedSession.muted = mute;
            this.enableSenderTracks(session, !managedSession.held && !managedSession.muted);
        }
    }
    /** Helper function to attach local media to html elements. */
    setupLocalMedia(session) {
        const managedSession = this.sessionManaged(session);
        if (!managedSession) {
            throw new Error("Managed session does not exist.");
        }
        // Get the local media element, if any, from the and configuraiton options
        // and save the info with the managed session so we can clean it up later.
        const mediaLocal = typeof this.options.media.local === "function" ? this.options.media.local(session) : this.options.media.local;
        managedSession.mediaLocal = mediaLocal;
        const mediaElement = mediaLocal === null || mediaLocal === void 0 ? void 0 : mediaLocal.video;
        if (mediaElement) {
            const localStream = this.getLocalMediaStream(session);
            if (!localStream) {
                throw new Error("Local media stream undefiend.");
            }
            mediaElement.srcObject = localStream;
            mediaElement.volume = 0;
            mediaElement.play().catch((error) => {
                this.logger.error(`[${session.id}] Failed to play local media`);
                this.logger.error(error.message);
            });
        }
    }
    /** Helper function to attach remote media to html elements. */
    setupRemoteMedia(session) {
        const managedSession = this.sessionManaged(session);
        if (!managedSession) {
            throw new Error("Managed session does not exist.");
        }
        // Get the remote media element, if any, from the and configuraiton options
        // and save the info with the managed session so we can clean it up later.
        const mediaRemote = typeof this.options.media.remote === "function" ? this.options.media.remote(session) : this.options.media.remote;
        managedSession.mediaRemote = mediaRemote;
        const mediaElement = (mediaRemote === null || mediaRemote === void 0 ? void 0 : mediaRemote.video) || (mediaRemote === null || mediaRemote === void 0 ? void 0 : mediaRemote.audio);
        if (mediaElement) {
            const remoteStream = this.getRemoteMediaStream(session);
            if (!remoteStream) {
                throw new Error("Remote media stream undefiend.");
            }
            mediaElement.autoplay = true; // Safari hack, because you cannot call .play() from a non user action
            mediaElement.srcObject = remoteStream;
            mediaElement.play().catch((error) => {
                this.logger.error(`[${session.id}] Failed to play remote media`);
                this.logger.error(error.message);
            });
            remoteStream.onaddtrack = () => {
                this.logger.log(`Remote media onaddtrack`);
                mediaElement.load(); // Safari hack, as it doesn't work otheriwse
                mediaElement.play().catch((error) => {
                    this.logger.error(`[${session.id}] Failed to play remote media`);
                    this.logger.error(error.message);
                });
            };
        }
    }
    /**
     * End a session.
     * @param session - The session to terminate.
     * @remarks
     * Send a BYE request, CANCEL request or reject response to end the current Session.
     * Resolves when the request/response is sent, otherwise rejects.
     * Use `onCallHangup` delegate method to determine if and when Session is terminated.
     */
    async terminate(session) {
        this.logger.log(`[${session.id}] Terminating...`);
        switch (session.state) {
            case SessionState.Initial:
                if (session instanceof Inviter) {
                    return session.cancel().then(() => {
                        this.logger.log(`[${session.id}] Inviter never sent INVITE (canceled)`);
                    });
                }
                else if (session instanceof Invitation) {
                    return session.reject().then(() => {
                        this.logger.log(`[${session.id}] Invitation rejected (sent 480)`);
                    });
                }
                else {
                    throw new Error("Unknown session type.");
                }
            case SessionState.Establishing:
                if (session instanceof Inviter) {
                    return session.cancel().then(() => {
                        this.logger.log(`[${session.id}] Inviter canceled (sent CANCEL)`);
                    });
                }
                else if (session instanceof Invitation) {
                    return session.reject().then(() => {
                        this.logger.log(`[${session.id}] Invitation rejected (sent 480)`);
                    });
                }
                else {
                    throw new Error("Unknown session type.");
                }
            case SessionState.Established:
                return session.bye().then(() => {
                    this.logger.log(`[${session.id}] Session ended (sent BYE)`);
                });
            case SessionState.Terminating:
                break;
            case SessionState.Terminated:
                break;
            default:
                throw new Error("Unknown state");
        }
        this.logger.log(`[${session.id}] Terminating in state ${session.state}, no action taken`);
        return Promise.resolve();
    }
}
