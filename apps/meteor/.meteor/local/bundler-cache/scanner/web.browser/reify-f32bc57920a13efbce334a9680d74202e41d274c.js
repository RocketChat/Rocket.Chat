module.export({Invitation:()=>Invitation});let fromBodyLegacy,getBody,Grammar,SignalingState,Timers,TransactionStateError;module.link("../core",{fromBodyLegacy(v){fromBodyLegacy=v},getBody(v){getBody=v},Grammar(v){Grammar=v},SignalingState(v){SignalingState=v},Timers(v){Timers=v},TransactionStateError(v){TransactionStateError=v}},0);let getReasonPhrase;module.link("../core/messages/utils",{getReasonPhrase(v){getReasonPhrase=v}},1);let ContentTypeUnsupportedError,SessionDescriptionHandlerError,SessionTerminatedError;module.link("./exceptions",{ContentTypeUnsupportedError(v){ContentTypeUnsupportedError=v},SessionDescriptionHandlerError(v){SessionDescriptionHandlerError=v},SessionTerminatedError(v){SessionTerminatedError=v}},2);let Session;module.link("./session",{Session(v){Session=v}},3);let SessionState;module.link("./session-state",{SessionState(v){SessionState=v}},4);let SIPExtension;module.link("./user-agent-options",{SIPExtension(v){SIPExtension=v}},5);





/**
 * An invitation is an offer to establish a {@link Session} (incoming INVITE).
 * @public
 */
class Invitation extends Session {
    /** @internal */
    constructor(userAgent, incomingInviteRequest) {
        super(userAgent);
        this.incomingInviteRequest = incomingInviteRequest;
        /** True if dispose() has been called. */
        this.disposed = false;
        /** INVITE will be rejected if not accepted within a certain period time. */
        this.expiresTimer = undefined;
        /** True if this Session has been Terminated due to a CANCEL request. */
        this.isCanceled = false;
        /** Are reliable provisional responses required or supported. */
        this.rel100 = "none";
        /** The current RSeq header value. */
        this.rseq = Math.floor(Math.random() * 10000);
        /** INVITE will be rejected if final response not sent in a certain period time. */
        this.userNoAnswerTimer = undefined;
        /** True if waiting for a PRACK before sending a 200 Ok. */
        this.waitingForPrack = false;
        this.logger = userAgent.getLogger("sip.Invitation");
        const incomingRequestMessage = this.incomingInviteRequest.message;
        // Set 100rel if necessary
        const requireHeader = incomingRequestMessage.getHeader("require");
        if (requireHeader && requireHeader.toLowerCase().includes("100rel")) {
            this.rel100 = "required";
        }
        const supportedHeader = incomingRequestMessage.getHeader("supported");
        if (supportedHeader && supportedHeader.toLowerCase().includes("100rel")) {
            this.rel100 = "supported";
        }
        // FIXME: HACK: This is a hack to port an existing behavior.
        // Set the toTag on the incoming request message to the toTag which
        // will be used in the response to the incoming request!!!
        // The behavior being ported appears to be a hack itself,
        // so this is a hack to port a hack. At least one test spec
        // relies on it (which is yet another hack).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        incomingRequestMessage.toTag = incomingInviteRequest.toTag;
        if (typeof incomingRequestMessage.toTag !== "string") {
            throw new TypeError("toTag should have been a string.");
        }
        // The following mapping values are RECOMMENDED:
        // ...
        // 19 no answer from the user              480 Temporarily unavailable
        // https://tools.ietf.org/html/rfc3398#section-7.2.4.1
        this.userNoAnswerTimer = setTimeout(() => {
            incomingInviteRequest.reject({ statusCode: 480 });
            this.stateTransition(SessionState.Terminated);
        }, this.userAgent.configuration.noAnswerTimeout ? this.userAgent.configuration.noAnswerTimeout * 1000 : 60000);
        // 1. If the request is an INVITE that contains an Expires header
        // field, the UAS core sets a timer for the number of seconds
        // indicated in the header field value.  When the timer fires, the
        // invitation is considered to be expired.  If the invitation
        // expires before the UAS has generated a final response, a 487
        // (Request Terminated) response SHOULD be generated.
        // https://tools.ietf.org/html/rfc3261#section-13.3.1
        if (incomingRequestMessage.hasHeader("expires")) {
            const expires = Number(incomingRequestMessage.getHeader("expires") || 0) * 1000;
            this.expiresTimer = setTimeout(() => {
                if (this.state === SessionState.Initial) {
                    incomingInviteRequest.reject({ statusCode: 487 });
                    this.stateTransition(SessionState.Terminated);
                }
            }, expires);
        }
        // Session parent properties
        const assertedIdentity = this.request.getHeader("P-Asserted-Identity");
        if (assertedIdentity) {
            this._assertedIdentity = Grammar.nameAddrHeaderParse(assertedIdentity);
        }
        this._contact = this.userAgent.contact.toString();
        const contentDisposition = incomingRequestMessage.parseHeader("Content-Disposition");
        if (contentDisposition && contentDisposition.type === "render") {
            this._renderbody = incomingRequestMessage.body;
            this._rendertype = incomingRequestMessage.getHeader("Content-Type");
        }
        // Identifier
        this._id = incomingRequestMessage.callId + incomingRequestMessage.fromTag;
        // Add to the user agent's session collection.
        this.userAgent._sessions[this._id] = this;
    }
    /**
     * Destructor.
     */
    dispose() {
        // Only run through this once. It can and does get called multiple times
        // depending on the what the sessions state is when first called.
        // For example, if called when "establishing" it will be called again
        // at least once when the session transitions to "terminated".
        // Regardless, running through this more than once is pointless.
        if (this.disposed) {
            return Promise.resolve();
        }
        this.disposed = true;
        // Clear timers
        if (this.expiresTimer) {
            clearTimeout(this.expiresTimer);
            this.expiresTimer = undefined;
        }
        if (this.userNoAnswerTimer) {
            clearTimeout(this.userNoAnswerTimer);
            this.userNoAnswerTimer = undefined;
        }
        // If accept() is still waiting for a PRACK, make sure it rejects
        this.prackNeverArrived();
        // If the final response for the initial INVITE not yet been sent, reject it
        switch (this.state) {
            case SessionState.Initial:
                return this.reject().then(() => super.dispose());
            case SessionState.Establishing:
                return this.reject().then(() => super.dispose());
            case SessionState.Established:
                return super.dispose();
            case SessionState.Terminating:
                return super.dispose();
            case SessionState.Terminated:
                return super.dispose();
            default:
                throw new Error("Unknown state.");
        }
    }
    /**
     * If true, a first provisional response after the 100 Trying
     * will be sent automatically. This is false it the UAC required
     * reliable provisional responses (100rel in Require header) or
     * the user agent configuration has specified to not send an
     * initial response, otherwise it is true. The provisional is sent by
     * calling `progress()` without any options.
     */
    get autoSendAnInitialProvisionalResponse() {
        return this.rel100 !== "required" && this.userAgent.configuration.sendInitialProvisionalResponse;
    }
    /**
     * Initial incoming INVITE request message body.
     */
    get body() {
        return this.incomingInviteRequest.message.body;
    }
    /**
     * The identity of the local user.
     */
    get localIdentity() {
        return this.request.to;
    }
    /**
     * The identity of the remote user.
     */
    get remoteIdentity() {
        return this.request.from;
    }
    /**
     * Initial incoming INVITE request message.
     */
    get request() {
        return this.incomingInviteRequest.message;
    }
    /**
     * Accept the invitation.
     *
     * @remarks
     * Accept the incoming INVITE request to start a Session.
     * Replies to the INVITE request with a 200 Ok response.
     * Resolves once the response sent, otherwise rejects.
     *
     * This method may reject for a variety of reasons including
     * the receipt of a CANCEL request before `accept` is able
     * to construct a response.
     * @param options - Options bucket.
     */
    accept(options = {}) {
        this.logger.log("Invitation.accept");
        // validate state
        if (this.state !== SessionState.Initial) {
            const error = new Error(`Invalid session state ${this.state}`);
            this.logger.error(error.message);
            return Promise.reject(error);
        }
        // Modifiers and options for initial INVITE transaction
        if (options.sessionDescriptionHandlerModifiers) {
            this.sessionDescriptionHandlerModifiers = options.sessionDescriptionHandlerModifiers;
        }
        if (options.sessionDescriptionHandlerOptions) {
            this.sessionDescriptionHandlerOptions = options.sessionDescriptionHandlerOptions;
        }
        // transition state
        this.stateTransition(SessionState.Establishing);
        return (this.sendAccept(options)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .then(({ message, session }) => {
            session.delegate = {
                onAck: (ackRequest) => this.onAckRequest(ackRequest),
                onAckTimeout: () => this.onAckTimeout(),
                onBye: (byeRequest) => this.onByeRequest(byeRequest),
                onInfo: (infoRequest) => this.onInfoRequest(infoRequest),
                onInvite: (inviteRequest) => this.onInviteRequest(inviteRequest),
                onMessage: (messageRequest) => this.onMessageRequest(messageRequest),
                onNotify: (notifyRequest) => this.onNotifyRequest(notifyRequest),
                onPrack: (prackRequest) => this.onPrackRequest(prackRequest),
                onRefer: (referRequest) => this.onReferRequest(referRequest)
            };
            this._dialog = session;
            this.stateTransition(SessionState.Established);
            // TODO: Reconsider this "automagic" send of a BYE to replacee behavior.
            // This behavior has been ported forward from legacy versions.
            if (this._replacee) {
                this._replacee._bye();
            }
        })
            .catch((error) => this.handleResponseError(error)));
    }
    /**
     * Indicate progress processing the invitation.
     *
     * @remarks
     * Report progress to the the caller.
     * Replies to the INVITE request with a 1xx provisional response.
     * Resolves once the response sent, otherwise rejects.
     * @param options - Options bucket.
     */
    progress(options = {}) {
        this.logger.log("Invitation.progress");
        // validate state
        if (this.state !== SessionState.Initial) {
            const error = new Error(`Invalid session state ${this.state}`);
            this.logger.error(error.message);
            return Promise.reject(error);
        }
        // Ported
        const statusCode = options.statusCode || 180;
        if (statusCode < 100 || statusCode > 199) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        // Modifiers and options for initial INVITE transaction
        if (options.sessionDescriptionHandlerModifiers) {
            this.sessionDescriptionHandlerModifiers = options.sessionDescriptionHandlerModifiers;
        }
        if (options.sessionDescriptionHandlerOptions) {
            this.sessionDescriptionHandlerOptions = options.sessionDescriptionHandlerOptions;
        }
        // After the first reliable provisional response for a request has been
        // acknowledged, the UAS MAY send additional reliable provisional
        // responses.  The UAS MUST NOT send a second reliable provisional
        // response until the first is acknowledged.  After the first, it is
        // RECOMMENDED that the UAS not send an additional reliable provisional
        // response until the previous is acknowledged.  The first reliable
        // provisional response receives special treatment because it conveys
        // the initial sequence number.  If additional reliable provisional
        // responses were sent before the first was acknowledged, the UAS could
        // not be certain these were received in order.
        // https://tools.ietf.org/html/rfc3262#section-3
        if (this.waitingForPrack) {
            this.logger.warn("Unexpected call for progress while waiting for prack, ignoring");
            return Promise.resolve();
        }
        // Trying provisional response
        if (options.statusCode === 100) {
            return this.sendProgressTrying()
                .then(() => {
                return;
            })
                .catch((error) => this.handleResponseError(error));
        }
        // Standard provisional response
        if (!(this.rel100 === "required") &&
            !(this.rel100 === "supported" && options.rel100) &&
            !(this.rel100 === "supported" && this.userAgent.configuration.sipExtension100rel === SIPExtension.Required)) {
            return this.sendProgress(options)
                .then(() => {
                return;
            })
                .catch((error) => this.handleResponseError(error));
        }
        // Reliable provisional response
        return this.sendProgressReliableWaitForPrack(options)
            .then(() => {
            return;
        })
            .catch((error) => this.handleResponseError(error));
    }
    /**
     * Reject the invitation.
     *
     * @remarks
     * Replies to the INVITE request with a 4xx, 5xx, or 6xx final response.
     * Resolves once the response sent, otherwise rejects.
     *
     * The expectation is that this method is used to reject an INVITE request.
     * That is indeed the case - a call to `progress` followed by `reject` is
     * a typical way to "decline" an incoming INVITE request. However it may
     * also be called after calling `accept` (but only before it completes)
     * which will reject the call and cause `accept` to reject.
     * @param options - Options bucket.
     */
    reject(options = {}) {
        this.logger.log("Invitation.reject");
        // validate state
        if (this.state !== SessionState.Initial && this.state !== SessionState.Establishing) {
            const error = new Error(`Invalid session state ${this.state}`);
            this.logger.error(error.message);
            return Promise.reject(error);
        }
        const statusCode = options.statusCode || 480;
        const reasonPhrase = options.reasonPhrase ? options.reasonPhrase : getReasonPhrase(statusCode);
        const extraHeaders = options.extraHeaders || [];
        if (statusCode < 300 || statusCode > 699) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        const body = options.body ? fromBodyLegacy(options.body) : undefined;
        // FIXME: Need to redirect to someplace
        statusCode < 400
            ? this.incomingInviteRequest.redirect([], { statusCode, reasonPhrase, extraHeaders, body })
            : this.incomingInviteRequest.reject({ statusCode, reasonPhrase, extraHeaders, body });
        this.stateTransition(SessionState.Terminated);
        return Promise.resolve();
    }
    /**
     * Handle CANCEL request.
     *
     * @param message - CANCEL message.
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _onCancel(message) {
        this.logger.log("Invitation._onCancel");
        // validate state
        if (this.state !== SessionState.Initial && this.state !== SessionState.Establishing) {
            this.logger.error(`CANCEL received while in state ${this.state}, dropping request`);
            return;
        }
        // flag canceled
        this.isCanceled = true;
        // reject INVITE with 487 status code
        this.incomingInviteRequest.reject({ statusCode: 487 });
        this.stateTransition(SessionState.Terminated);
    }
    /**
     * Helper function to handle offer/answer in a PRACK.
     */
    handlePrackOfferAnswer(request) {
        if (!this.dialog) {
            throw new Error("Dialog undefined.");
        }
        // If the PRACK doesn't have an offer/answer, nothing to be done.
        const body = getBody(request.message);
        if (!body || body.contentDisposition !== "session") {
            return Promise.resolve(undefined);
        }
        const options = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        };
        // If the UAC receives a reliable provisional response with an offer
        // (this would occur if the UAC sent an INVITE without an offer, in
        // which case the first reliable provisional response will contain the
        // offer), it MUST generate an answer in the PRACK.  If the UAC receives
        // a reliable provisional response with an answer, it MAY generate an
        // additional offer in the PRACK.  If the UAS receives a PRACK with an
        // offer, it MUST place the answer in the 2xx to the PRACK.
        // https://tools.ietf.org/html/rfc3262#section-5
        switch (this.dialog.signalingState) {
            case SignalingState.Initial:
                // State should never be reached as first reliable provisional response must have answer/offer.
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
            case SignalingState.Stable:
                // Receved answer.
                return this.setAnswer(body, options).then(() => undefined);
            case SignalingState.HaveLocalOffer:
                // State should never be reached as local offer would be answered by this PRACK
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
            case SignalingState.HaveRemoteOffer:
                // Received offer, generate answer.
                return this.setOfferAndGetAnswer(body, options);
            case SignalingState.Closed:
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
            default:
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
        }
    }
    /**
     * A handler for errors which occur while attempting to send 1xx and 2xx responses.
     * In all cases, an attempt is made to reject the request if it is still outstanding.
     * And while there are a variety of things which can go wrong and we log something here
     * for all errors, there are a handful of common exceptions we pay some extra attention to.
     * @param error - The error which occurred.
     */
    handleResponseError(error) {
        let statusCode = 480; // "Temporarily Unavailable"
        // Log Error message
        if (error instanceof Error) {
            this.logger.error(error.message);
        }
        else {
            // We don't actually know what a session description handler implementation might throw our way,
            // and more generally as a last resort catch all, just assume we are getting an "unknown" and log it.
            this.logger.error(error);
        }
        // Log Exception message
        if (error instanceof ContentTypeUnsupportedError) {
            this.logger.error("A session description handler occurred while sending response (content type unsupported");
            statusCode = 415; // "Unsupported Media Type"
        }
        else if (error instanceof SessionDescriptionHandlerError) {
            this.logger.error("A session description handler occurred while sending response");
        }
        else if (error instanceof SessionTerminatedError) {
            this.logger.error("Session ended before response could be formulated and sent (while waiting for PRACK)");
        }
        else if (error instanceof TransactionStateError) {
            this.logger.error("Session changed state before response could be formulated and sent");
        }
        // Reject if still in "initial" or "establishing" state.
        if (this.state === SessionState.Initial || this.state === SessionState.Establishing) {
            try {
                this.incomingInviteRequest.reject({ statusCode });
                this.stateTransition(SessionState.Terminated);
            }
            catch (e) {
                this.logger.error("An error occurred attempting to reject the request while handling another error");
                throw e; // This is not a good place to be...
            }
        }
        // FIXME: TODO:
        // Here we are squelching the throwing of errors due to an race condition.
        // We have an internal race between calling `accept()` and handling an incoming
        // CANCEL request. As there is no good way currently to delegate the handling of
        // these race errors to the caller of `accept()`, we are squelching the throwing
        // of ALL errors when/if they occur after receiving a CANCEL to catch the ONE we know
        // is a "normal" exceptional condition. While this is a completely reasonable approach,
        // the decision should be left up to the library user. Furthermore, as we are eating
        // ALL errors in this case, we are potentially (likely) hiding "real" errors which occur.
        //
        // Only rethrow error if the session has not been canceled.
        if (this.isCanceled) {
            this.logger.warn("An error occurred while attempting to formulate and send a response to an incoming INVITE." +
                " However a CANCEL was received and processed while doing so which can (and often does) result" +
                " in errors occurring as the session terminates in the meantime. Said error is being ignored.");
            return;
        }
        throw error;
    }
    /**
     * Callback for when ACK for a 2xx response is never received.
     * @param session - Session the ACK never arrived for.
     */
    onAckTimeout() {
        this.logger.log("Invitation.onAckTimeout");
        if (!this.dialog) {
            throw new Error("Dialog undefined.");
        }
        this.logger.log("No ACK received for an extended period of time, terminating session");
        this.dialog.bye();
        this.stateTransition(SessionState.Terminated);
    }
    /**
     * A version of `accept` which resolves a session when the 200 Ok response is sent.
     * @param options - Options bucket.
     */
    sendAccept(options = {}) {
        const responseOptions = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        };
        const extraHeaders = options.extraHeaders || [];
        // The UAS MAY send a final response to the initial request before
        // having received PRACKs for all unacknowledged reliable provisional
        // responses, unless the final response is 2xx and any of the
        // unacknowledged reliable provisional responses contained a session
        // description.  In that case, it MUST NOT send a final response until
        // those provisional responses are acknowledged.  If the UAS does send a
        // final response when reliable responses are still unacknowledged, it
        // SHOULD NOT continue to retransmit the unacknowledged reliable
        // provisional responses, but it MUST be prepared to process PRACK
        // requests for those outstanding responses.  A UAS MUST NOT send new
        // reliable provisional responses (as opposed to retransmissions of
        // unacknowledged ones) after sending a final response to a request.
        // https://tools.ietf.org/html/rfc3262#section-3
        if (this.waitingForPrack) {
            return this.waitForArrivalOfPrack()
                .then(() => clearTimeout(this.userNoAnswerTimer)) // Ported
                .then(() => this.generateResponseOfferAnswer(this.incomingInviteRequest, responseOptions))
                .then((body) => this.incomingInviteRequest.accept({ statusCode: 200, body, extraHeaders }));
        }
        clearTimeout(this.userNoAnswerTimer); // Ported
        return this.generateResponseOfferAnswer(this.incomingInviteRequest, responseOptions).then((body) => this.incomingInviteRequest.accept({ statusCode: 200, body, extraHeaders }));
    }
    /**
     * A version of `progress` which resolves when the provisional response is sent.
     * @param options - Options bucket.
     */
    sendProgress(options = {}) {
        const statusCode = options.statusCode || 180;
        const reasonPhrase = options.reasonPhrase;
        const extraHeaders = (options.extraHeaders || []).slice();
        const body = options.body ? fromBodyLegacy(options.body) : undefined;
        // The 183 (Session Progress) response is used to convey information
        // about the progress of the call that is not otherwise classified.  The
        // Reason-Phrase, header fields, or message body MAY be used to convey
        // more details about the call progress.
        // https://tools.ietf.org/html/rfc3261#section-21.1.5
        // It is the de facto industry standard to utilize 183 with SDP to provide "early media".
        // While it is unlikely someone would want to send a 183 without SDP, so it should be an option.
        if (statusCode === 183 && !body) {
            return this.sendProgressWithSDP(options);
        }
        try {
            const progressResponse = this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
            this._dialog = progressResponse.session;
            return Promise.resolve(progressResponse);
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    /**
     * A version of `progress` which resolves when the provisional response with sdp is sent.
     * @param options - Options bucket.
     */
    sendProgressWithSDP(options = {}) {
        const responseOptions = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        };
        const statusCode = options.statusCode || 183;
        const reasonPhrase = options.reasonPhrase;
        const extraHeaders = (options.extraHeaders || []).slice();
        // Get an offer/answer and send a reply.
        return this.generateResponseOfferAnswer(this.incomingInviteRequest, responseOptions)
            .then((body) => this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body }))
            .then((progressResponse) => {
            this._dialog = progressResponse.session;
            return progressResponse;
        });
    }
    /**
     * A version of `progress` which resolves when the reliable provisional response is sent.
     * @param options - Options bucket.
     */
    sendProgressReliable(options = {}) {
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.extraHeaders.push("Require: 100rel");
        options.extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));
        return this.sendProgressWithSDP(options);
    }
    /**
     * A version of `progress` which resolves when the reliable provisional response is acknowledged.
     * @param options - Options bucket.
     */
    sendProgressReliableWaitForPrack(options = {}) {
        const responseOptions = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        };
        const statusCode = options.statusCode || 183;
        const reasonPhrase = options.reasonPhrase;
        const extraHeaders = (options.extraHeaders || []).slice();
        extraHeaders.push("Require: 100rel");
        extraHeaders.push("RSeq: " + this.rseq++);
        let body;
        return new Promise((resolve, reject) => {
            this.waitingForPrack = true;
            this.generateResponseOfferAnswer(this.incomingInviteRequest, responseOptions)
                .then((offerAnswer) => {
                body = offerAnswer;
                return this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
            })
                .then((progressResponse) => {
                this._dialog = progressResponse.session;
                let prackRequest;
                let prackResponse;
                progressResponse.session.delegate = {
                    onPrack: (request) => {
                        prackRequest = request;
                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                        clearTimeout(prackWaitTimeoutTimer);
                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                        clearTimeout(rel1xxRetransmissionTimer);
                        if (!this.waitingForPrack) {
                            return;
                        }
                        this.waitingForPrack = false;
                        this.handlePrackOfferAnswer(prackRequest)
                            .then((prackResponseBody) => {
                            try {
                                prackResponse = prackRequest.accept({ statusCode: 200, body: prackResponseBody });
                                this.prackArrived();
                                resolve({ prackRequest, prackResponse, progressResponse });
                            }
                            catch (error) {
                                reject(error);
                            }
                        })
                            .catch((error) => reject(error));
                    }
                };
                // https://tools.ietf.org/html/rfc3262#section-3
                const prackWaitTimeout = () => {
                    if (!this.waitingForPrack) {
                        return;
                    }
                    this.waitingForPrack = false;
                    this.logger.warn("No PRACK received, rejecting INVITE.");
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    clearTimeout(rel1xxRetransmissionTimer);
                    this.reject({ statusCode: 504 })
                        .then(() => reject(new SessionTerminatedError()))
                        .catch((error) => reject(error));
                };
                const prackWaitTimeoutTimer = setTimeout(prackWaitTimeout, Timers.T1 * 64);
                // https://tools.ietf.org/html/rfc3262#section-3
                const rel1xxRetransmission = () => {
                    try {
                        this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
                    }
                    catch (error) {
                        this.waitingForPrack = false;
                        reject(error);
                        return;
                    }
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    rel1xxRetransmissionTimer = setTimeout(rel1xxRetransmission, (timeout *= 2));
                };
                let timeout = Timers.T1;
                let rel1xxRetransmissionTimer = setTimeout(rel1xxRetransmission, timeout);
            })
                .catch((error) => {
                this.waitingForPrack = false;
                reject(error);
            });
        });
    }
    /**
     * A version of `progress` which resolves when a 100 Trying provisional response is sent.
     */
    sendProgressTrying() {
        try {
            const progressResponse = this.incomingInviteRequest.trying();
            return Promise.resolve(progressResponse);
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    /**
     * When attempting to accept the INVITE, an invitation waits
     * for any outstanding PRACK to arrive before sending the 200 Ok.
     * It will be waiting on this Promise to resolve which lets it know
     * the PRACK has arrived and it may proceed to send the 200 Ok.
     */
    waitForArrivalOfPrack() {
        if (this.waitingForPrackPromise) {
            throw new Error("Already waiting for PRACK");
        }
        this.waitingForPrackPromise = new Promise((resolve, reject) => {
            this.waitingForPrackResolve = resolve;
            this.waitingForPrackReject = reject;
        });
        return this.waitingForPrackPromise;
    }
    /**
     * Here we are resolving the promise which in turn will cause
     * the accept to proceed (it may still fail for other reasons, but...).
     */
    prackArrived() {
        if (this.waitingForPrackResolve) {
            this.waitingForPrackResolve();
        }
        this.waitingForPrackPromise = undefined;
        this.waitingForPrackResolve = undefined;
        this.waitingForPrackReject = undefined;
    }
    /**
     * Here we are rejecting the promise which in turn will cause
     * the accept to fail and the session to transition to "terminated".
     */
    prackNeverArrived() {
        if (this.waitingForPrackReject) {
            this.waitingForPrackReject(new SessionTerminatedError());
        }
        this.waitingForPrackPromise = undefined;
        this.waitingForPrackResolve = undefined;
        this.waitingForPrackReject = undefined;
    }
}
