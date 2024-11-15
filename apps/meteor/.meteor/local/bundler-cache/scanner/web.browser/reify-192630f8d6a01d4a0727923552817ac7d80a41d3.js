module.export({UserAgentCore:()=>UserAgentCore});let C,constructOutgoingResponse,OutgoingRequestMessage;module.link("../messages",{C(v){C=v},constructOutgoingResponse(v){constructOutgoingResponse=v},OutgoingRequestMessage(v){OutgoingRequestMessage=v}},0);let InviteServerTransaction,NonInviteClientTransaction,TransactionState;module.link("../transactions",{InviteServerTransaction(v){InviteServerTransaction=v},NonInviteClientTransaction(v){NonInviteClientTransaction=v},TransactionState(v){TransactionState=v}},1);let InviteUserAgentClient,InviteUserAgentServer,MessageUserAgentClient,MessageUserAgentServer,NotifyUserAgentServer,PublishUserAgentClient,ReferUserAgentServer,RegisterUserAgentClient,RegisterUserAgentServer,SubscribeUserAgentClient,SubscribeUserAgentServer,UserAgentClient;module.link("../user-agents",{InviteUserAgentClient(v){InviteUserAgentClient=v},InviteUserAgentServer(v){InviteUserAgentServer=v},MessageUserAgentClient(v){MessageUserAgentClient=v},MessageUserAgentServer(v){MessageUserAgentServer=v},NotifyUserAgentServer(v){NotifyUserAgentServer=v},PublishUserAgentClient(v){PublishUserAgentClient=v},ReferUserAgentServer(v){ReferUserAgentServer=v},RegisterUserAgentClient(v){RegisterUserAgentClient=v},RegisterUserAgentServer(v){RegisterUserAgentServer=v},SubscribeUserAgentClient(v){SubscribeUserAgentClient=v},SubscribeUserAgentServer(v){SubscribeUserAgentServer=v},UserAgentClient(v){UserAgentClient=v}},2);let AllowedMethods;module.link("./allowed-methods",{AllowedMethods(v){AllowedMethods=v}},3);



/**
 * This is ported from UA.C.ACCEPTED_BODY_TYPES.
 * FIXME: TODO: Should be configurable/variable.
 */
const acceptedBodyTypes = ["application/sdp", "application/dtmf-relay"];
/**
 * User Agent Core.
 * @remarks
 * Core designates the functions specific to a particular type
 * of SIP entity, i.e., specific to either a stateful or stateless
 * proxy, a user agent or registrar.  All cores, except those for
 * the stateless proxy, are transaction users.
 * https://tools.ietf.org/html/rfc3261#section-6
 *
 * UAC Core: The set of processing functions required of a UAC that
 * reside above the transaction and transport layers.
 * https://tools.ietf.org/html/rfc3261#section-6
 *
 * UAS Core: The set of processing functions required at a UAS that
 * resides above the transaction and transport layers.
 * https://tools.ietf.org/html/rfc3261#section-6
 * @public
 */
class UserAgentCore {
    /**
     * Constructor.
     * @param configuration - Configuration.
     * @param delegate - Delegate.
     */
    constructor(configuration, delegate = {}) {
        /** UACs. */
        this.userAgentClients = new Map();
        /** UASs. */
        this.userAgentServers = new Map();
        this.configuration = configuration;
        this.delegate = delegate;
        this.dialogs = new Map();
        this.subscribers = new Map();
        this.logger = configuration.loggerFactory.getLogger("sip.user-agent-core");
    }
    /** Destructor. */
    dispose() {
        this.reset();
    }
    /** Reset. */
    reset() {
        this.dialogs.forEach((dialog) => dialog.dispose());
        this.dialogs.clear();
        this.subscribers.forEach((subscriber) => subscriber.dispose());
        this.subscribers.clear();
        this.userAgentClients.forEach((uac) => uac.dispose());
        this.userAgentClients.clear();
        this.userAgentServers.forEach((uac) => uac.dispose());
        this.userAgentServers.clear();
    }
    /** Logger factory. */
    get loggerFactory() {
        return this.configuration.loggerFactory;
    }
    /** Transport. */
    get transport() {
        const transport = this.configuration.transportAccessor();
        if (!transport) {
            throw new Error("Transport undefined.");
        }
        return transport;
    }
    /**
     * Send INVITE.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    invite(request, delegate) {
        return new InviteUserAgentClient(this, request, delegate);
    }
    /**
     * Send MESSAGE.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    message(request, delegate) {
        return new MessageUserAgentClient(this, request, delegate);
    }
    /**
     * Send PUBLISH.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    publish(request, delegate) {
        return new PublishUserAgentClient(this, request, delegate);
    }
    /**
     * Send REGISTER.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    register(request, delegate) {
        return new RegisterUserAgentClient(this, request, delegate);
    }
    /**
     * Send SUBSCRIBE.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    subscribe(request, delegate) {
        return new SubscribeUserAgentClient(this, request, delegate);
    }
    /**
     * Send a request.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    request(request, delegate) {
        return new UserAgentClient(NonInviteClientTransaction, this, request, delegate);
    }
    /**
     * Outgoing request message factory function.
     * @param method - Method.
     * @param requestURI - Request-URI.
     * @param fromURI - From URI.
     * @param toURI - To URI.
     * @param options - Request options.
     * @param extraHeaders - Extra headers to add.
     * @param body - Message body.
     */
    makeOutgoingRequestMessage(method, requestURI, fromURI, toURI, options, extraHeaders, body) {
        // default values from user agent configuration
        const callIdPrefix = this.configuration.sipjsId;
        const fromDisplayName = this.configuration.displayName;
        const forceRport = this.configuration.viaForceRport;
        const hackViaTcp = this.configuration.hackViaTcp;
        const optionTags = this.configuration.supportedOptionTags.slice();
        if (method === C.REGISTER) {
            optionTags.push("path", "gruu");
        }
        if (method === C.INVITE && (this.configuration.contact.pubGruu || this.configuration.contact.tempGruu)) {
            optionTags.push("gruu");
        }
        const routeSet = this.configuration.routeSet;
        const userAgentString = this.configuration.userAgentHeaderFieldValue;
        const viaHost = this.configuration.viaHost;
        const defaultOptions = {
            callIdPrefix,
            forceRport,
            fromDisplayName,
            hackViaTcp,
            optionTags,
            routeSet,
            userAgentString,
            viaHost
        };
        // merge provided options with default options
        const requestOptions = Object.assign(Object.assign({}, defaultOptions), options);
        return new OutgoingRequestMessage(method, requestURI, fromURI, toURI, requestOptions, extraHeaders, body);
    }
    /**
     * Handle an incoming request message from the transport.
     * @param message - Incoming request message from transport layer.
     */
    receiveIncomingRequestFromTransport(message) {
        this.receiveRequestFromTransport(message);
    }
    /**
     * Handle an incoming response message from the transport.
     * @param message - Incoming response message from transport layer.
     */
    receiveIncomingResponseFromTransport(message) {
        this.receiveResponseFromTransport(message);
    }
    /**
     * A stateless UAS is a UAS that does not maintain transaction state.
     * It replies to requests normally, but discards any state that would
     * ordinarily be retained by a UAS after a response has been sent.  If a
     * stateless UAS receives a retransmission of a request, it regenerates
     * the response and re-sends it, just as if it were replying to the first
     * instance of the request. A UAS cannot be stateless unless the request
     * processing for that method would always result in the same response
     * if the requests are identical. This rules out stateless registrars,
     * for example.  Stateless UASs do not use a transaction layer; they
     * receive requests directly from the transport layer and send responses
     * directly to the transport layer.
     * https://tools.ietf.org/html/rfc3261#section-8.2.7
     * @param message - Incoming request message to reply to.
     * @param statusCode - Status code to reply with.
     */
    replyStateless(message, options) {
        const userAgent = this.configuration.userAgentHeaderFieldValue;
        const supported = this.configuration.supportedOptionTagsResponse;
        options = Object.assign(Object.assign({}, options), { userAgent, supported });
        const response = constructOutgoingResponse(message, options);
        this.transport.send(response.message).catch((error) => {
            // If the transport rejects, it SHOULD reject with a TransportError.
            // But the transport may be external code, so we are careful...
            if (error instanceof Error) {
                this.logger.error(error.message);
            }
            this.logger.error(`Transport error occurred sending stateless reply to ${message.method} request.`);
            // TODO: Currently there is no hook to provide notification that a transport error occurred
            // and throwing would result in an uncaught error (in promise), so we silently eat the error.
            // Furthermore, silently eating stateless reply transport errors is arguably what we want to do here.
        });
        return response;
    }
    /**
     * In Section 18.2.1, replace the last paragraph with:
     *
     * Next, the server transport attempts to match the request to a
     * server transaction.  It does so using the matching rules described
     * in Section 17.2.3.  If a matching server transaction is found, the
     * request is passed to that transaction for processing.  If no match
     * is found, the request is passed to the core, which may decide to
     * construct a new server transaction for that request.
     * https://tools.ietf.org/html/rfc6026#section-8.10
     * @param message - Incoming request message from transport layer.
     */
    receiveRequestFromTransport(message) {
        // When a request is received from the network by the server, it has to
        // be matched to an existing transaction.  This is accomplished in the
        // following manner.
        //
        // The branch parameter in the topmost Via header field of the request
        // is examined.  If it is present and begins with the magic cookie
        // "z9hG4bK", the request was generated by a client transaction
        // compliant to this specification.  Therefore, the branch parameter
        // will be unique across all transactions sent by that client.  The
        // request matches a transaction if:
        //
        //    1. the branch parameter in the request is equal to the one in the
        //       top Via header field of the request that created the
        //       transaction, and
        //
        //    2. the sent-by value in the top Via of the request is equal to the
        //       one in the request that created the transaction, and
        //
        //    3. the method of the request matches the one that created the
        //       transaction, except for ACK, where the method of the request
        //       that created the transaction is INVITE.
        //
        // This matching rule applies to both INVITE and non-INVITE transactions
        // alike.
        //
        //    The sent-by value is used as part of the matching process because
        //    there could be accidental or malicious duplication of branch
        //    parameters from different clients.
        // https://tools.ietf.org/html/rfc3261#section-17.2.3
        const transactionId = message.viaBranch; // FIXME: Currently only using rule 1...
        const uas = this.userAgentServers.get(transactionId);
        // When receiving an ACK that matches an existing INVITE server
        // transaction and that does not contain a branch parameter containing
        // the magic cookie defined in RFC 3261, the matching transaction MUST
        // be checked to see if it is in the "Accepted" state.  If it is, then
        // the ACK must be passed directly to the transaction user instead of
        // being absorbed by the transaction state machine.  This is necessary
        // as requests from RFC 2543 clients will not include a unique branch
        // parameter, and the mechanisms for calculating the transaction ID from
        // such a request will be the same for both INVITE and ACKs.
        // https://tools.ietf.org/html/rfc6026#section-6
        // Any ACKs received from the network while in the "Accepted" state MUST be
        // passed directly to the TU and not absorbed.
        // https://tools.ietf.org/html/rfc6026#section-7.1
        if (message.method === C.ACK) {
            if (uas && uas.transaction.state === TransactionState.Accepted) {
                if (uas instanceof InviteUserAgentServer) {
                    // These are ACKs matching an INVITE server transaction.
                    // These should never happen with RFC 3261 compliant user agents
                    // (would be a broken ACK to negative final response or something)
                    // but is apparently how RFC 2543 user agents do things.
                    // We are not currently supporting this case.
                    // NOTE: Not backwards compatible with RFC 2543 (no support for strict-routing).
                    this.logger.warn(`Discarding out of dialog ACK after 2xx response sent on transaction ${transactionId}.`);
                    return;
                }
            }
        }
        // The CANCEL method requests that the TU at the server side cancel a
        // pending transaction.  The TU determines the transaction to be
        // cancelled by taking the CANCEL request, and then assuming that the
        // request method is anything but CANCEL or ACK and applying the
        // transaction matching procedures of Section 17.2.3.  The matching
        // transaction is the one to be cancelled.
        // https://tools.ietf.org/html/rfc3261#section-9.2
        if (message.method === C.CANCEL) {
            if (uas) {
                // Regardless of the method of the original request, as long as the
                // CANCEL matched an existing transaction, the UAS answers the CANCEL
                // request itself with a 200 (OK) response.
                // https://tools.ietf.org/html/rfc3261#section-9.2
                this.replyStateless(message, { statusCode: 200 });
                // If the transaction for the original request still exists, the behavior
                // of the UAS on receiving a CANCEL request depends on whether it has already
                // sent a final response for the original request. If it has, the CANCEL
                // request has no effect on the processing of the original request, no
                // effect on any session state, and no effect on the responses generated
                // for the original request. If the UAS has not issued a final response
                // for the original request, its behavior depends on the method of the
                // original request. If the original request was an INVITE, the UAS
                // SHOULD immediately respond to the INVITE with a 487 (Request
                // Terminated).
                // https://tools.ietf.org/html/rfc3261#section-9.2
                if (uas.transaction instanceof InviteServerTransaction &&
                    uas.transaction.state === TransactionState.Proceeding) {
                    if (uas instanceof InviteUserAgentServer) {
                        uas.receiveCancel(message);
                    }
                    // A CANCEL request has no impact on the processing of
                    // transactions with any other method defined in this specification.
                    // https://tools.ietf.org/html/rfc3261#section-9.2
                }
            }
            else {
                // If the UAS did not find a matching transaction for the CANCEL
                // according to the procedure above, it SHOULD respond to the CANCEL
                // with a 481 (Call Leg/Transaction Does Not Exist).
                // https://tools.ietf.org/html/rfc3261#section-9.2
                this.replyStateless(message, { statusCode: 481 });
            }
            return;
        }
        // If a matching server transaction is found, the request is passed to that
        // transaction for processing.
        // https://tools.ietf.org/html/rfc6026#section-8.10
        if (uas) {
            uas.transaction.receiveRequest(message);
            return;
        }
        // If no match is found, the request is passed to the core, which may decide to
        // construct a new server transaction for that request.
        // https://tools.ietf.org/html/rfc6026#section-8.10
        this.receiveRequest(message);
        return;
    }
    /**
     * UAC and UAS procedures depend strongly on two factors.  First, based
     * on whether the request or response is inside or outside of a dialog,
     * and second, based on the method of a request.  Dialogs are discussed
     * thoroughly in Section 12; they represent a peer-to-peer relationship
     * between user agents and are established by specific SIP methods, such
     * as INVITE.
     * @param message - Incoming request message.
     */
    receiveRequest(message) {
        // 8.2 UAS Behavior
        // UASs SHOULD process the requests in the order of the steps that
        // follow in this section (that is, starting with authentication, then
        // inspecting the method, the header fields, and so on throughout the
        // remainder of this section).
        // https://tools.ietf.org/html/rfc3261#section-8.2
        // 8.2.1 Method Inspection
        // Once a request is authenticated (or authentication is skipped), the
        // UAS MUST inspect the method of the request.  If the UAS recognizes
        // but does not support the method of a request, it MUST generate a 405
        // (Method Not Allowed) response.  Procedures for generating responses
        // are described in Section 8.2.6.  The UAS MUST also add an Allow
        // header field to the 405 (Method Not Allowed) response.  The Allow
        // header field MUST list the set of methods supported by the UAS
        // generating the message.
        // https://tools.ietf.org/html/rfc3261#section-8.2.1
        if (!AllowedMethods.includes(message.method)) {
            const allowHeader = "Allow: " + AllowedMethods.toString();
            this.replyStateless(message, {
                statusCode: 405,
                extraHeaders: [allowHeader]
            });
            return;
        }
        // 8.2.2 Header Inspection
        // https://tools.ietf.org/html/rfc3261#section-8.2.2
        if (!message.ruri) {
            // FIXME: A request message should always have an ruri
            throw new Error("Request-URI undefined.");
        }
        // 8.2.2.1 To and Request-URI
        // If the Request-URI uses a scheme not supported by the UAS, it SHOULD
        // reject the request with a 416 (Unsupported URI Scheme) response.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.1
        if (message.ruri.scheme !== "sip") {
            this.replyStateless(message, { statusCode: 416 });
            return;
        }
        // 8.2.2.1 To and Request-URI
        // If the Request-URI does not identify an address that the
        // UAS is willing to accept requests for, it SHOULD reject
        // the request with a 404 (Not Found) response.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.1
        const ruri = message.ruri;
        const ruriMatches = (uri) => {
            return !!uri && uri.user === ruri.user;
        };
        if (!ruriMatches(this.configuration.aor) &&
            !(ruriMatches(this.configuration.contact.uri) ||
                ruriMatches(this.configuration.contact.pubGruu) ||
                ruriMatches(this.configuration.contact.tempGruu))) {
            this.logger.warn("Request-URI does not point to us.");
            if (message.method !== C.ACK) {
                this.replyStateless(message, { statusCode: 404 });
            }
            return;
        }
        // 8.2.2.1 To and Request-URI
        // Other potential sources of received Request-URIs include
        // the Contact header fields of requests and responses sent by the UA
        // that establish or refresh dialogs.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.1
        if (message.method === C.INVITE) {
            if (!message.hasHeader("Contact")) {
                this.replyStateless(message, {
                    statusCode: 400,
                    reasonPhrase: "Missing Contact Header"
                });
                return;
            }
        }
        // 8.2.2.2 Merged Requests
        // If the request has no tag in the To header field, the UAS core MUST
        // check the request against ongoing transactions.  If the From tag,
        // Call-ID, and CSeq exactly match those associated with an ongoing
        // transaction, but the request does not match that transaction (based
        // on the matching rules in Section 17.2.3), the UAS core SHOULD
        // generate a 482 (Loop Detected) response and pass it to the server
        // transaction.
        //
        //    The same request has arrived at the UAS more than once, following
        //    different paths, most likely due to forking.  The UAS processes
        //    the first such request received and responds with a 482 (Loop
        //    Detected) to the rest of them.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.2
        if (!message.toTag) {
            const transactionId = message.viaBranch;
            if (!this.userAgentServers.has(transactionId)) {
                const mergedRequest = Array.from(this.userAgentServers.values()).some((uas) => uas.transaction.request.fromTag === message.fromTag &&
                    uas.transaction.request.callId === message.callId &&
                    uas.transaction.request.cseq === message.cseq);
                if (mergedRequest) {
                    this.replyStateless(message, { statusCode: 482 });
                    return;
                }
            }
        }
        // 8.2.2.3 Require
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.3
        // TODO
        // 8.2.3 Content Processing
        // https://tools.ietf.org/html/rfc3261#section-8.2.3
        // TODO
        // 8.2.4 Applying Extensions
        // https://tools.ietf.org/html/rfc3261#section-8.2.4
        // TODO
        // 8.2.5 Processing the Request
        // Assuming all of the checks in the previous subsections are passed,
        // the UAS processing becomes method-specific.
        // https://tools.ietf.org/html/rfc3261#section-8.2.5
        // The UAS will receive the request from the transaction layer.  If the
        // request has a tag in the To header field, the UAS core computes the
        // dialog identifier corresponding to the request and compares it with
        // existing dialogs.  If there is a match, this is a mid-dialog request.
        // In that case, the UAS first applies the same processing rules for
        // requests outside of a dialog, discussed in Section 8.2.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (message.toTag) {
            this.receiveInsideDialogRequest(message);
        }
        else {
            this.receiveOutsideDialogRequest(message);
        }
        return;
    }
    /**
     * Once a dialog has been established between two UAs, either of them
     * MAY initiate new transactions as needed within the dialog.  The UA
     * sending the request will take the UAC role for the transaction.  The
     * UA receiving the request will take the UAS role.  Note that these may
     * be different roles than the UAs held during the transaction that
     * established the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.2
     * @param message - Incoming request message.
     */
    receiveInsideDialogRequest(message) {
        // NOTIFY requests are matched to such SUBSCRIBE requests if they
        // contain the same "Call-ID", a "To" header field "tag" parameter that
        // matches the "From" header field "tag" parameter of the SUBSCRIBE
        // request, and the same "Event" header field.  Rules for comparisons of
        // the "Event" header fields are described in Section 8.2.1.
        // https://tools.ietf.org/html/rfc6665#section-4.4.1
        if (message.method === C.NOTIFY) {
            const event = message.parseHeader("Event");
            if (!event || !event.event) {
                this.replyStateless(message, { statusCode: 489 });
                return;
            }
            // FIXME: Subscriber id should also matching on event id.
            const subscriberId = message.callId + message.toTag + event.event;
            const subscriber = this.subscribers.get(subscriberId);
            if (subscriber) {
                const uas = new NotifyUserAgentServer(this, message);
                subscriber.onNotify(uas);
                return;
            }
        }
        // Requests sent within a dialog, as any other requests, are atomic.  If
        // a particular request is accepted by the UAS, all the state changes
        // associated with it are performed.  If the request is rejected, none
        // of the state changes are performed.
        //
        //    Note that some requests, such as INVITEs, affect several pieces of
        //    state.
        //
        // The UAS will receive the request from the transaction layer.  If the
        // request has a tag in the To header field, the UAS core computes the
        // dialog identifier corresponding to the request and compares it with
        // existing dialogs.  If there is a match, this is a mid-dialog request.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        const dialogId = message.callId + message.toTag + message.fromTag;
        const dialog = this.dialogs.get(dialogId);
        if (dialog) {
            // [Sip-implementors] Reg. SIP reinvite, UPDATE and OPTIONS
            // You got the question right.
            //
            // And you got the right answer too. :-)
            //
            //   Thanks,
            //   Paul
            //
            // Robert Sparks wrote:
            // > So I've lost track of the question during the musing.
            // >
            // > I _think_ the fundamental question being asked is this:
            // >
            // > Is an endpoint required to reject (with a 481) an OPTIONS request that
            // > arrives with at to-tag but does not match any existing dialog state.
            // > (Assuming some earlier requirement hasn't forced another error code). Or
            // > is it OK if it just sends
            // > a 200 OK anyhow.
            // >
            // > My take on the collection of specs is that its _not_ ok for it to send
            // > the 200 OK anyhow and that it is required to send
            // > the 481. I base this primarily on these sentences from 11.2 in 3261:
            // >
            // >    The response to an OPTIONS is constructed using the standard rules
            // >    for a SIP response as discussed in Section 8.2.6.  The response code
            // >    chosen MUST be the same that would have been chosen had the request
            // >    been an INVITE.
            // >
            // > Did I miss the point of the question?
            // >
            // > On May 15, 2008, at 12:48 PM, Paul Kyzivat wrote:
            // >
            // >> [Including Robert in hopes of getting his insight on this.]
            // https://lists.cs.columbia.edu/pipermail/sip-implementors/2008-May/019178.html
            //
            // Requests that do not change in any way the state of a dialog may be
            // received within a dialog (for example, an OPTIONS request).  They are
            // processed as if they had been received outside the dialog.
            // https://tools.ietf.org/html/rfc3261#section-12.2.2
            if (message.method === C.OPTIONS) {
                const allowHeader = "Allow: " + AllowedMethods.toString();
                const acceptHeader = "Accept: " + acceptedBodyTypes.toString();
                this.replyStateless(message, {
                    statusCode: 200,
                    extraHeaders: [allowHeader, acceptHeader]
                });
                return;
            }
            // Pass the incoming request to the dialog for further handling.
            dialog.receiveRequest(message);
            return;
        }
        // The most important behaviors of a stateless UAS are the following:
        // ...
        // o  A stateless UAS MUST ignore ACK requests.
        // ...
        // https://tools.ietf.org/html/rfc3261#section-8.2.7
        if (message.method === C.ACK) {
            // If a final response to an INVITE was sent statelessly,
            // the corresponding ACK:
            // - will not match an existing transaction
            // - may have tag in the To header field
            // - not not match any existing dialogs
            // Absorb unmatched ACKs.
            return;
        }
        // If the request has a tag in the To header field, but the dialog
        // identifier does not match any existing dialogs, the UAS may have
        // crashed and restarted, or it may have received a request for a
        // different (possibly failed) UAS (the UASs can construct the To tags
        // so that a UAS can identify that the tag was for a UAS for which it is
        // providing recovery).  Another possibility is that the incoming
        // request has been simply mis-routed.  Based on the To tag, the UAS MAY
        // either accept or reject the request.  Accepting the request for
        // acceptable To tags provides robustness, so that dialogs can persist
        // even through crashes.  UAs wishing to support this capability must
        // take into consideration some issues such as choosing monotonically
        // increasing CSeq sequence numbers even across reboots, reconstructing
        // the route set, and accepting out-of-range RTP timestamps and sequence
        // numbers.
        //
        // If the UAS wishes to reject the request because it does not wish to
        // recreate the dialog, it MUST respond to the request with a 481
        // (Call/Transaction Does Not Exist) status code and pass that to the
        // server transaction.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        this.replyStateless(message, { statusCode: 481 });
        return;
    }
    /**
     * Assuming all of the checks in the previous subsections are passed,
     * the UAS processing becomes method-specific.
     *  https://tools.ietf.org/html/rfc3261#section-8.2.5
     * @param message - Incoming request message.
     */
    receiveOutsideDialogRequest(message) {
        switch (message.method) {
            case C.ACK:
                // Absorb stray out of dialog ACKs
                break;
            case C.BYE:
                // If the BYE does not match an existing dialog, the UAS core SHOULD
                // generate a 481 (Call/Transaction Does Not Exist) response and pass
                // that to the server transaction. This rule means that a BYE sent
                // without tags by a UAC will be rejected.
                // https://tools.ietf.org/html/rfc3261#section-15.1.2
                this.replyStateless(message, { statusCode: 481 });
                break;
            case C.CANCEL:
                throw new Error(`Unexpected out of dialog request method ${message.method}.`);
                break;
            case C.INFO:
                // Use of the INFO method does not constitute a separate dialog usage.
                // INFO messages are always part of, and share the fate of, an invite
                // dialog usage [RFC5057].  INFO messages cannot be sent as part of
                // other dialog usages, or outside an existing dialog.
                // https://tools.ietf.org/html/rfc6086#section-1
                this.replyStateless(message, { statusCode: 405 }); // Should never happen
                break;
            case C.INVITE:
                // https://tools.ietf.org/html/rfc3261#section-13.3.1
                {
                    const uas = new InviteUserAgentServer(this, message);
                    this.delegate.onInvite ? this.delegate.onInvite(uas) : uas.reject();
                }
                break;
            case C.MESSAGE:
                // MESSAGE requests are discouraged inside a dialog.  Implementations
                // are restricted from creating a usage for the purpose of carrying a
                // sequence of MESSAGE requests (though some implementations use it that
                // way, against the standard recommendation).
                // https://tools.ietf.org/html/rfc5057#section-5.3
                {
                    const uas = new MessageUserAgentServer(this, message);
                    this.delegate.onMessage ? this.delegate.onMessage(uas) : uas.accept();
                }
                break;
            case C.NOTIFY:
                // Obsoleted by: RFC 6665
                // If any non-SUBSCRIBE mechanisms are defined to create subscriptions,
                // it is the responsibility of the parties defining those mechanisms to
                // ensure that correlation of a NOTIFY message to the corresponding
                // subscription is possible.  Designers of such mechanisms are also
                // warned to make a distinction between sending a NOTIFY message to a
                // subscriber who is aware of the subscription, and sending a NOTIFY
                // message to an unsuspecting node.  The latter behavior is invalid, and
                // MUST receive a "481 Subscription does not exist" response (unless
                // some other 400- or 500-class error code is more applicable), as
                // described in section 3.2.4.  In other words, knowledge of a
                // subscription must exist in both the subscriber and the notifier to be
                // valid, even if installed via a non-SUBSCRIBE mechanism.
                // https://tools.ietf.org/html/rfc3265#section-3.2
                //
                // NOTIFY requests are sent to inform subscribers of changes in state to
                // which the subscriber has a subscription.  Subscriptions are created
                // using the SUBSCRIBE method.  In legacy implementations, it is
                // possible that other means of subscription creation have been used.
                // However, this specification does not allow the creation of
                // subscriptions except through SUBSCRIBE requests and (for backwards-
                // compatibility) REFER requests [RFC3515].
                // https://tools.ietf.org/html/rfc6665#section-3.2
                {
                    const uas = new NotifyUserAgentServer(this, message);
                    this.delegate.onNotify ? this.delegate.onNotify(uas) : uas.reject({ statusCode: 405 });
                }
                break;
            case C.OPTIONS:
                // https://tools.ietf.org/html/rfc3261#section-11.2
                {
                    const allowHeader = "Allow: " + AllowedMethods.toString();
                    const acceptHeader = "Accept: " + acceptedBodyTypes.toString();
                    this.replyStateless(message, {
                        statusCode: 200,
                        extraHeaders: [allowHeader, acceptHeader]
                    });
                }
                break;
            case C.REFER:
                // https://tools.ietf.org/html/rfc3515#section-2.4.2
                {
                    const uas = new ReferUserAgentServer(this, message);
                    this.delegate.onRefer ? this.delegate.onRefer(uas) : uas.reject({ statusCode: 405 });
                }
                break;
            case C.REGISTER:
                // https://tools.ietf.org/html/rfc3261#section-10.3
                {
                    const uas = new RegisterUserAgentServer(this, message);
                    this.delegate.onRegister ? this.delegate.onRegister(uas) : uas.reject({ statusCode: 405 });
                }
                break;
            case C.SUBSCRIBE:
                // https://tools.ietf.org/html/rfc6665#section-4.2
                {
                    const uas = new SubscribeUserAgentServer(this, message);
                    this.delegate.onSubscribe ? this.delegate.onSubscribe(uas) : uas.reject({ statusCode: 480 });
                }
                break;
            default:
                throw new Error(`Unexpected out of dialog request method ${message.method}.`);
        }
        return;
    }
    /**
     * Responses are first processed by the transport layer and then passed
     * up to the transaction layer.  The transaction layer performs its
     * processing and then passes the response up to the TU.  The majority
     * of response processing in the TU is method specific.  However, there
     * are some general behaviors independent of the method.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3
     * @param message - Incoming response message from transport layer.
     */
    receiveResponseFromTransport(message) {
        // 8.1.3.1 Transaction Layer Errors
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.1
        // Handled by transaction layer callbacks.
        // 8.1.3.2 Unrecognized Responses
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.1
        // TODO
        // 8.1.3.3 Vias
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.3
        if (message.getHeaders("via").length > 1) {
            this.logger.warn("More than one Via header field present in the response, dropping");
            return;
        }
        // 8.1.3.4 Processing 3xx Responses
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.4
        // TODO
        // 8.1.3.5 Processing 4xx Responses
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.5
        // TODO
        // When the transport layer in the client receives a response, it has to
        // determine which client transaction will handle the response, so that
        // the processing of Sections 17.1.1 and 17.1.2 can take place.  The
        // branch parameter in the top Via header field is used for this
        // purpose.  A response matches a client transaction under two
        // conditions:
        //
        //    1.  If the response has the same value of the branch parameter in
        //        the top Via header field as the branch parameter in the top
        //        Via header field of the request that created the transaction.
        //
        //    2.  If the method parameter in the CSeq header field matches the
        //        method of the request that created the transaction.  The
        //        method is needed since a CANCEL request constitutes a
        //        different transaction, but shares the same value of the branch
        //        parameter.
        // https://tools.ietf.org/html/rfc3261#section-17.1.3
        const userAgentClientId = message.viaBranch + message.method;
        const userAgentClient = this.userAgentClients.get(userAgentClientId);
        // The client transport uses the matching procedures of Section
        // 17.1.3 to attempt to match the response to an existing
        // transaction.  If there is a match, the response MUST be passed to
        // that transaction.  Otherwise, any element other than a stateless
        // proxy MUST silently discard the response.
        // https://tools.ietf.org/html/rfc6026#section-8.9
        if (userAgentClient) {
            userAgentClient.transaction.receiveResponse(message);
        }
        else {
            this.logger.warn(`Discarding unmatched ${message.statusCode} response to ${message.method} ${userAgentClientId}.`);
        }
    }
}
