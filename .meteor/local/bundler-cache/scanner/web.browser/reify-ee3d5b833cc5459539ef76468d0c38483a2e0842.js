module.export({SubscriptionDialog:()=>SubscriptionDialog});let C,NameAddrHeader;module.link("../messages",{C(v){C=v},NameAddrHeader(v){NameAddrHeader=v}},0);let SubscriptionState;module.link("../subscription",{SubscriptionState(v){SubscriptionState=v}},1);let Timers;module.link("../timers",{Timers(v){Timers=v}},2);let AllowedMethods;module.link("../user-agent-core/allowed-methods",{AllowedMethods(v){AllowedMethods=v}},3);let NotifyUserAgentServer;module.link("../user-agents/notify-user-agent-server",{NotifyUserAgentServer(v){NotifyUserAgentServer=v}},4);let ReSubscribeUserAgentClient;module.link("../user-agents/re-subscribe-user-agent-client",{ReSubscribeUserAgentClient(v){ReSubscribeUserAgentClient=v}},5);let Dialog;module.link("./dialog",{Dialog(v){Dialog=v}},6);






/**
 * Subscription Dialog.
 * @remarks
 * SIP-Specific Event Notification
 *
 * Abstract
 *
 *    This document describes an extension to the Session Initiation
 *    Protocol (SIP) defined by RFC 3261.  The purpose of this extension is
 *    to provide an extensible framework by which SIP nodes can request
 *    notification from remote nodes indicating that certain events have
 *    occurred.
 *
 *    Note that the event notification mechanisms defined herein are NOT
 *    intended to be a general-purpose infrastructure for all classes of
 *    event subscription and notification.
 *
 *    This document represents a backwards-compatible improvement on the
 *    original mechanism described by RFC 3265, taking into account several
 *    years of implementation experience.  Accordingly, this document
 *    obsoletes RFC 3265.  This document also updates RFC 4660 slightly to
 *    accommodate some small changes to the mechanism that were discussed
 *    in that document.
 *
 *  https://tools.ietf.org/html/rfc6665
 * @public
 */
class SubscriptionDialog extends Dialog {
    constructor(subscriptionEvent, subscriptionExpires, subscriptionState, core, state, delegate) {
        super(core, state);
        this.delegate = delegate;
        this._autoRefresh = false;
        this._subscriptionEvent = subscriptionEvent;
        this._subscriptionExpires = subscriptionExpires;
        this._subscriptionExpiresInitial = subscriptionExpires;
        this._subscriptionExpiresLastSet = Math.floor(Date.now() / 1000);
        this._subscriptionRefresh = undefined;
        this._subscriptionRefreshLastSet = undefined;
        this._subscriptionState = subscriptionState;
        this.logger = core.loggerFactory.getLogger("sip.subscribe-dialog");
        this.logger.log(`SUBSCRIBE dialog ${this.id} constructed`);
    }
    /**
     * When a UAC receives a response that establishes a dialog, it
     * constructs the state of the dialog.  This state MUST be maintained
     * for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.2
     * @param outgoingRequestMessage - Outgoing request message for dialog.
     * @param incomingResponseMessage - Incoming response message creating dialog.
     */
    static initialDialogStateForSubscription(outgoingSubscribeRequestMessage, incomingNotifyRequestMessage) {
        // If the request was sent over TLS, and the Request-URI contained a
        // SIPS URI, the "secure" flag is set to TRUE.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        const secure = false; // FIXME: Currently no support for TLS.
        // The route set MUST be set to the list of URIs in the Record-Route
        // header field from the response, taken in reverse order and preserving
        // all URI parameters.  If no Record-Route header field is present in
        // the response, the route set MUST be set to the empty set.  This route
        // set, even if empty, overrides any pre-existing route set for future
        // requests in this dialog.  The remote target MUST be set to the URI
        // from the Contact header field of the response.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        const routeSet = incomingNotifyRequestMessage.getHeaders("record-route");
        const contact = incomingNotifyRequestMessage.parseHeader("contact");
        if (!contact) {
            // TODO: Review to make sure this will never happen
            throw new Error("Contact undefined.");
        }
        if (!(contact instanceof NameAddrHeader)) {
            throw new Error("Contact not instance of NameAddrHeader.");
        }
        const remoteTarget = contact.uri;
        // The local sequence number MUST be set to the value of the sequence
        // number in the CSeq header field of the request.  The remote sequence
        // number MUST be empty (it is established when the remote UA sends a
        // request within the dialog).  The call identifier component of the
        // dialog ID MUST be set to the value of the Call-ID in the request.
        // The local tag component of the dialog ID MUST be set to the tag in
        // the From field in the request, and the remote tag component of the
        // dialog ID MUST be set to the tag in the To field of the response.  A
        // UAC MUST be prepared to receive a response without a tag in the To
        // field, in which case the tag is considered to have a value of null.
        //
        //    This is to maintain backwards compatibility with RFC 2543, which
        //    did not mandate To tags.
        //
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        const localSequenceNumber = outgoingSubscribeRequestMessage.cseq;
        const remoteSequenceNumber = undefined;
        const callId = outgoingSubscribeRequestMessage.callId;
        const localTag = outgoingSubscribeRequestMessage.fromTag;
        const remoteTag = incomingNotifyRequestMessage.fromTag;
        if (!callId) {
            // TODO: Review to make sure this will never happen
            throw new Error("Call id undefined.");
        }
        if (!localTag) {
            // TODO: Review to make sure this will never happen
            throw new Error("From tag undefined.");
        }
        if (!remoteTag) {
            // TODO: Review to make sure this will never happen
            throw new Error("To tag undefined."); // FIXME: No backwards compatibility with RFC 2543
        }
        // The remote URI MUST be set to the URI in the To field, and the local
        // URI MUST be set to the URI in the From field.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        if (!outgoingSubscribeRequestMessage.from) {
            // TODO: Review to make sure this will never happen
            throw new Error("From undefined.");
        }
        if (!outgoingSubscribeRequestMessage.to) {
            // TODO: Review to make sure this will never happen
            throw new Error("To undefined.");
        }
        const localURI = outgoingSubscribeRequestMessage.from.uri;
        const remoteURI = outgoingSubscribeRequestMessage.to.uri;
        // A dialog can also be in the "early" state, which occurs when it is
        // created with a provisional response, and then transition to the
        // "confirmed" state when a 2xx final response arrives.
        // https://tools.ietf.org/html/rfc3261#section-12
        const early = false;
        const dialogState = {
            id: callId + localTag + remoteTag,
            early,
            callId,
            localTag,
            remoteTag,
            localSequenceNumber,
            remoteSequenceNumber,
            localURI,
            remoteURI,
            remoteTarget,
            routeSet,
            secure
        };
        return dialogState;
    }
    dispose() {
        super.dispose();
        if (this.N) {
            clearTimeout(this.N);
            this.N = undefined;
        }
        this.refreshTimerClear();
        this.logger.log(`SUBSCRIBE dialog ${this.id} destroyed`);
    }
    get autoRefresh() {
        return this._autoRefresh;
    }
    set autoRefresh(autoRefresh) {
        this._autoRefresh = true;
        this.refreshTimerSet();
    }
    get subscriptionEvent() {
        return this._subscriptionEvent;
    }
    /** Number of seconds until subscription expires. */
    get subscriptionExpires() {
        const secondsSinceLastSet = Math.floor(Date.now() / 1000) - this._subscriptionExpiresLastSet;
        const secondsUntilExpires = this._subscriptionExpires - secondsSinceLastSet;
        return Math.max(secondsUntilExpires, 0);
    }
    set subscriptionExpires(expires) {
        if (expires < 0) {
            throw new Error("Expires must be greater than or equal to zero.");
        }
        this._subscriptionExpires = expires;
        this._subscriptionExpiresLastSet = Math.floor(Date.now() / 1000);
        if (this.autoRefresh) {
            const refresh = this.subscriptionRefresh;
            if (refresh === undefined || refresh >= expires) {
                this.refreshTimerSet();
            }
        }
    }
    get subscriptionExpiresInitial() {
        return this._subscriptionExpiresInitial;
    }
    /** Number of seconds until subscription auto refresh. */
    get subscriptionRefresh() {
        if (this._subscriptionRefresh === undefined || this._subscriptionRefreshLastSet === undefined) {
            return undefined;
        }
        const secondsSinceLastSet = Math.floor(Date.now() / 1000) - this._subscriptionRefreshLastSet;
        const secondsUntilExpires = this._subscriptionRefresh - secondsSinceLastSet;
        return Math.max(secondsUntilExpires, 0);
    }
    get subscriptionState() {
        return this._subscriptionState;
    }
    /**
     * Receive in dialog request message from transport.
     * @param message -  The incoming request message.
     */
    receiveRequest(message) {
        this.logger.log(`SUBSCRIBE dialog ${this.id} received ${message.method} request`);
        // Request within a dialog out of sequence guard.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (!this.sequenceGuard(message)) {
            this.logger.log(`SUBSCRIBE dialog ${this.id} rejected out of order ${message.method} request.`);
            return;
        }
        // Request within a dialog common processing.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        super.receiveRequest(message);
        // Switch on method and then delegate.
        switch (message.method) {
            case C.NOTIFY:
                this.onNotify(message);
                break;
            default:
                this.logger.log(`SUBSCRIBE dialog ${this.id} received unimplemented ${message.method} request`);
                this.core.replyStateless(message, { statusCode: 501 });
                break;
        }
    }
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    refresh() {
        const allowHeader = "Allow: " + AllowedMethods.toString();
        const options = {};
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.extraHeaders.push(allowHeader);
        options.extraHeaders.push("Event: " + this.subscriptionEvent);
        options.extraHeaders.push("Expires: " + this.subscriptionExpiresInitial);
        options.extraHeaders.push("Contact: " + this.core.configuration.contact.toString());
        return this.subscribe(undefined, options);
    }
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     * @param delegate - Delegate to handle responses.
     * @param options - Options bucket.
     */
    subscribe(delegate, options = {}) {
        if (this.subscriptionState !== SubscriptionState.Pending && this.subscriptionState !== SubscriptionState.Active) {
            // FIXME: This needs to be a proper exception
            throw new Error(`Invalid state ${this.subscriptionState}. May only re-subscribe while in state "pending" or "active".`);
        }
        this.logger.log(`SUBSCRIBE dialog ${this.id} sending SUBSCRIBE request`);
        const uac = new ReSubscribeUserAgentClient(this, delegate, options);
        // Abort any outstanding timer (as it would otherwise become guaranteed to terminate us).
        if (this.N) {
            clearTimeout(this.N);
            this.N = undefined;
        }
        // When refreshing a subscription, a subscriber starts Timer N, set to
        // 64*T1, when it sends the SUBSCRIBE request.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2.2
        this.N = setTimeout(() => this.timerN(), Timers.TIMER_N);
        return uac;
    }
    /**
     * 4.4.1.  Dialog Creation and Termination
     * A subscription is destroyed after a notifier sends a NOTIFY request
     * with a "Subscription-State" of "terminated", or in certain error
     * situations described elsewhere in this document.
     * https://tools.ietf.org/html/rfc6665#section-4.4.1
     */
    terminate() {
        this.stateTransition(SubscriptionState.Terminated);
        this.onTerminated();
    }
    /**
     * 4.1.2.3.  Unsubscribing
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.3
     */
    unsubscribe() {
        const allowHeader = "Allow: " + AllowedMethods.toString();
        const options = {};
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.extraHeaders.push(allowHeader);
        options.extraHeaders.push("Event: " + this.subscriptionEvent);
        options.extraHeaders.push("Expires: 0");
        options.extraHeaders.push("Contact: " + this.core.configuration.contact.toString());
        return this.subscribe(undefined, options);
    }
    /**
     * Handle in dialog NOTIFY requests.
     * This does not include the first NOTIFY which created the dialog.
     * @param message - The incoming NOTIFY request message.
     */
    onNotify(message) {
        // If, for some reason, the event package designated in the "Event"
        // header field of the NOTIFY request is not supported, the subscriber
        // will respond with a 489 (Bad Event) response.
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        const event = message.parseHeader("Event").event;
        if (!event || event !== this.subscriptionEvent) {
            this.core.replyStateless(message, { statusCode: 489 });
            return;
        }
        // In the state diagram, "Re-subscription times out" means that an
        // attempt to refresh or update the subscription using a new SUBSCRIBE
        // request does not result in a NOTIFY request before the corresponding
        // Timer N expires.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2
        if (this.N) {
            clearTimeout(this.N);
            this.N = undefined;
        }
        // NOTIFY requests MUST contain "Subscription-State" header fields that
        // indicate the status of the subscription.
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        const subscriptionState = message.parseHeader("Subscription-State");
        if (!subscriptionState || !subscriptionState.state) {
            this.core.replyStateless(message, { statusCode: 489 });
            return;
        }
        const state = subscriptionState.state;
        const expires = subscriptionState.expires ? Math.max(subscriptionState.expires, 0) : undefined;
        // Update our state and expiration.
        switch (state) {
            case "pending":
                this.stateTransition(SubscriptionState.Pending, expires);
                break;
            case "active":
                this.stateTransition(SubscriptionState.Active, expires);
                break;
            case "terminated":
                this.stateTransition(SubscriptionState.Terminated, expires);
                break;
            default:
                this.logger.warn("Unrecognized subscription state.");
                break;
        }
        // Delegate remainder of NOTIFY handling.
        const uas = new NotifyUserAgentServer(this, message);
        if (this.delegate && this.delegate.onNotify) {
            this.delegate.onNotify(uas);
        }
        else {
            uas.accept();
        }
    }
    onRefresh(request) {
        if (this.delegate && this.delegate.onRefresh) {
            this.delegate.onRefresh(request);
        }
    }
    onTerminated() {
        if (this.delegate && this.delegate.onTerminated) {
            this.delegate.onTerminated();
        }
    }
    refreshTimerClear() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = undefined;
        }
    }
    refreshTimerSet() {
        this.refreshTimerClear();
        if (this.autoRefresh && this.subscriptionExpires > 0) {
            const refresh = this.subscriptionExpires * 900;
            this._subscriptionRefresh = Math.floor(refresh / 1000);
            this._subscriptionRefreshLastSet = Math.floor(Date.now() / 1000);
            this.refreshTimer = setTimeout(() => {
                this.refreshTimer = undefined;
                this._subscriptionRefresh = undefined;
                this._subscriptionRefreshLastSet = undefined;
                this.onRefresh(this.refresh());
            }, refresh);
        }
    }
    stateTransition(newState, newExpires) {
        // Assert valid state transitions.
        const invalidStateTransition = () => {
            this.logger.warn(`Invalid subscription state transition from ${this.subscriptionState} to ${newState}`);
        };
        switch (newState) {
            case SubscriptionState.Initial:
                invalidStateTransition();
                return;
            case SubscriptionState.NotifyWait:
                invalidStateTransition();
                return;
            case SubscriptionState.Pending:
                if (this.subscriptionState !== SubscriptionState.NotifyWait &&
                    this.subscriptionState !== SubscriptionState.Pending) {
                    invalidStateTransition();
                    return;
                }
                break;
            case SubscriptionState.Active:
                if (this.subscriptionState !== SubscriptionState.NotifyWait &&
                    this.subscriptionState !== SubscriptionState.Pending &&
                    this.subscriptionState !== SubscriptionState.Active) {
                    invalidStateTransition();
                    return;
                }
                break;
            case SubscriptionState.Terminated:
                if (this.subscriptionState !== SubscriptionState.NotifyWait &&
                    this.subscriptionState !== SubscriptionState.Pending &&
                    this.subscriptionState !== SubscriptionState.Active) {
                    invalidStateTransition();
                    return;
                }
                break;
            default:
                invalidStateTransition();
                return;
        }
        // If the "Subscription-State" value is "pending", the subscription has
        // been received by the notifier, but there is insufficient policy
        // information to grant or deny the subscription yet.  If the header
        // field also contains an "expires" parameter, the subscriber SHOULD
        // take it as the authoritative subscription duration and adjust
        // accordingly.  No further action is necessary on the part of the
        // subscriber.  The "retry-after" and "reason" parameters have no
        // semantics for "pending".
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        if (newState === SubscriptionState.Pending) {
            if (newExpires) {
                this.subscriptionExpires = newExpires;
            }
        }
        // If the "Subscription-State" header field value is "active", it means
        // that the subscription has been accepted and (in general) has been
        // authorized.  If the header field also contains an "expires"
        // parameter, the subscriber SHOULD take it as the authoritative
        // subscription duration and adjust accordingly.  The "retry-after" and
        // "reason" parameters have no semantics for "active".
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        if (newState === SubscriptionState.Active) {
            if (newExpires) {
                this.subscriptionExpires = newExpires;
            }
        }
        // If the "Subscription-State" value is "terminated", the subscriber
        // MUST consider the subscription terminated.  The "expires" parameter
        // has no semantics for "terminated" -- notifiers SHOULD NOT include an
        // "expires" parameter on a "Subscription-State" header field with a
        // value of "terminated", and subscribers MUST ignore any such
        // parameter, if present.
        if (newState === SubscriptionState.Terminated) {
            this.dispose();
        }
        this._subscriptionState = newState;
    }
    /**
     * When refreshing a subscription, a subscriber starts Timer N, set to
     * 64*T1, when it sends the SUBSCRIBE request.  If this Timer N expires
     * prior to the receipt of a NOTIFY request, the subscriber considers
     * the subscription terminated.  If the subscriber receives a success
     * response to the SUBSCRIBE request that indicates that no NOTIFY
     * request will be generated -- such as the 204 response defined for use
     * with the optional extension described in [RFC5839] -- then it MUST
     * cancel Timer N.
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    timerN() {
        this.logger.warn(`Timer N expired for SUBSCRIBE dialog. Timed out waiting for NOTIFY.`);
        if (this.subscriptionState !== SubscriptionState.Terminated) {
            this.stateTransition(SubscriptionState.Terminated);
            this.onTerminated();
        }
    }
}
