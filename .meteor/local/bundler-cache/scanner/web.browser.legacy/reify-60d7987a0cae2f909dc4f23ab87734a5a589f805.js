module.export({Dialog:function(){return Dialog}});var C,NameAddrHeader;module.link("../messages",{C:function(v){C=v},NameAddrHeader:function(v){NameAddrHeader=v}},0);
/**
 * Dialog.
 * @remarks
 * A key concept for a user agent is that of a dialog.  A dialog
 * represents a peer-to-peer SIP relationship between two user agents
 * that persists for some time.  The dialog facilitates sequencing of
 * messages between the user agents and proper routing of requests
 * between both of them.  The dialog represents a context in which to
 * interpret SIP messages.
 * https://tools.ietf.org/html/rfc3261#section-12
 * @public
 */
class Dialog {
    /**
     * Dialog constructor.
     * @param core - User agent core.
     * @param dialogState - Initial dialog state.
     */
    constructor(core, dialogState) {
        this.core = core;
        this.dialogState = dialogState;
        this.core.dialogs.set(this.id, this);
    }
    /**
     * When a UAC receives a response that establishes a dialog, it
     * constructs the state of the dialog.  This state MUST be maintained
     * for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.2
     * @param outgoingRequestMessage - Outgoing request message for dialog.
     * @param incomingResponseMessage - Incoming response message creating dialog.
     */
    static initialDialogStateForUserAgentClient(outgoingRequestMessage, incomingResponseMessage) {
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
        const routeSet = incomingResponseMessage.getHeaders("record-route").reverse();
        // When a UAS responds to a request with a response that establishes a
        // dialog (such as a 2xx to INVITE), the UAS MUST copy all Record-Route
        // header field values from the request into the response (including the
        // URIs, URI parameters, and any Record-Route header field parameters,
        // whether they are known or unknown to the UAS) and MUST maintain the
        // order of those values.  The UAS MUST add a Contact header field to
        // the response.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        const contact = incomingResponseMessage.parseHeader("contact");
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
        const localSequenceNumber = outgoingRequestMessage.cseq;
        const remoteSequenceNumber = undefined;
        const callId = outgoingRequestMessage.callId;
        const localTag = outgoingRequestMessage.fromTag;
        const remoteTag = incomingResponseMessage.toTag;
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
        if (!outgoingRequestMessage.from) {
            // TODO: Review to make sure this will never happen
            throw new Error("From undefined.");
        }
        if (!outgoingRequestMessage.to) {
            // TODO: Review to make sure this will never happen
            throw new Error("To undefined.");
        }
        const localURI = outgoingRequestMessage.from.uri;
        const remoteURI = outgoingRequestMessage.to.uri;
        // A dialog can also be in the "early" state, which occurs when it is
        // created with a provisional response, and then transition to the
        // "confirmed" state when a 2xx final response arrives.
        // https://tools.ietf.org/html/rfc3261#section-12
        if (!incomingResponseMessage.statusCode) {
            throw new Error("Incoming response status code undefined.");
        }
        const early = incomingResponseMessage.statusCode < 200 ? true : false;
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
    /**
     * The UAS then constructs the state of the dialog.  This state MUST be
     * maintained for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.1
     * @param incomingRequestMessage - Incoming request message creating dialog.
     * @param toTag - Tag in the To field in the response to the incoming request.
     */
    static initialDialogStateForUserAgentServer(incomingRequestMessage, toTag, early = false) {
        // If the request arrived over TLS, and the Request-URI contained a SIPS
        // URI, the "secure" flag is set to TRUE.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        const secure = false; // FIXME: Currently no support for TLS.
        // The route set MUST be set to the list of URIs in the Record-Route
        // header field from the request, taken in order and preserving all URI
        // parameters.  If no Record-Route header field is present in the
        // request, the route set MUST be set to the empty set.  This route set,
        // even if empty, overrides any pre-existing route set for future
        // requests in this dialog.  The remote target MUST be set to the URI
        // from the Contact header field of the request.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        const routeSet = incomingRequestMessage.getHeaders("record-route");
        const contact = incomingRequestMessage.parseHeader("contact");
        if (!contact) {
            // TODO: Review to make sure this will never happen
            throw new Error("Contact undefined.");
        }
        if (!(contact instanceof NameAddrHeader)) {
            throw new Error("Contact not instance of NameAddrHeader.");
        }
        const remoteTarget = contact.uri;
        // The remote sequence number MUST be set to the value of the sequence
        // number in the CSeq header field of the request.  The local sequence
        // number MUST be empty.  The call identifier component of the dialog ID
        // MUST be set to the value of the Call-ID in the request.  The local
        // tag component of the dialog ID MUST be set to the tag in the To field
        // in the response to the request (which always includes a tag), and the
        // remote tag component of the dialog ID MUST be set to the tag from the
        // From field in the request.  A UAS MUST be prepared to receive a
        // request without a tag in the From field, in which case the tag is
        // considered to have a value of null.
        //
        //    This is to maintain backwards compatibility with RFC 2543, which
        //    did not mandate From tags.
        //
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        const remoteSequenceNumber = incomingRequestMessage.cseq;
        const localSequenceNumber = undefined;
        const callId = incomingRequestMessage.callId;
        const localTag = toTag;
        const remoteTag = incomingRequestMessage.fromTag;
        // The remote URI MUST be set to the URI in the From field, and the
        // local URI MUST be set to the URI in the To field.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        const remoteURI = incomingRequestMessage.from.uri;
        const localURI = incomingRequestMessage.to.uri;
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
    /** Destructor. */
    dispose() {
        this.core.dialogs.delete(this.id);
    }
    /**
     * A dialog is identified at each UA with a dialog ID, which consists of
     * a Call-ID value, a local tag and a remote tag.  The dialog ID at each
     * UA involved in the dialog is not the same.  Specifically, the local
     * tag at one UA is identical to the remote tag at the peer UA.  The
     * tags are opaque tokens that facilitate the generation of unique
     * dialog IDs.
     * https://tools.ietf.org/html/rfc3261#section-12
     */
    get id() {
        return this.dialogState.id;
    }
    /**
     * A dialog can also be in the "early" state, which occurs when it is
     * created with a provisional response, and then it transition to the
     * "confirmed" state when a 2xx final response received or is sent.
     *
     * Note: RFC 3261 is concise on when a dialog is "confirmed", but it
     * can be a point of confusion if an INVITE dialog is "confirmed" after
     * a 2xx is sent or after receiving the ACK for the 2xx response.
     * With careful reading it can be inferred a dialog is always is
     * "confirmed" when the 2xx is sent (regardless of type of dialog).
     * However a INVITE dialog does have additional considerations
     * when it is confirmed but an ACK has not yet been received (in
     * particular with regard to a callee sending BYE requests).
     */
    get early() {
        return this.dialogState.early;
    }
    /** Call identifier component of the dialog id. */
    get callId() {
        return this.dialogState.callId;
    }
    /** Local tag component of the dialog id. */
    get localTag() {
        return this.dialogState.localTag;
    }
    /** Remote tag component of the dialog id. */
    get remoteTag() {
        return this.dialogState.remoteTag;
    }
    /** Local sequence number (used to order requests from the UA to its peer). */
    get localSequenceNumber() {
        return this.dialogState.localSequenceNumber;
    }
    /** Remote sequence number (used to order requests from its peer to the UA). */
    get remoteSequenceNumber() {
        return this.dialogState.remoteSequenceNumber;
    }
    /** Local URI. */
    get localURI() {
        return this.dialogState.localURI;
    }
    /** Remote URI. */
    get remoteURI() {
        return this.dialogState.remoteURI;
    }
    /** Remote target. */
    get remoteTarget() {
        return this.dialogState.remoteTarget;
    }
    /**
     * Route set, which is an ordered list of URIs. The route set is the
     * list of servers that need to be traversed to send a request to the peer.
     */
    get routeSet() {
        return this.dialogState.routeSet;
    }
    /**
     * If the request was sent over TLS, and the Request-URI contained
     * a SIPS URI, the "secure" flag is set to true. *NOT IMPLEMENTED*
     */
    get secure() {
        return this.dialogState.secure;
    }
    /** The user agent core servicing this dialog. */
    get userAgentCore() {
        return this.core;
    }
    /** Confirm the dialog. Only matters if dialog is currently early. */
    confirm() {
        this.dialogState.early = false;
    }
    /**
     * Requests sent within a dialog, as any other requests, are atomic.  If
     * a particular request is accepted by the UAS, all the state changes
     * associated with it are performed.  If the request is rejected, none
     * of the state changes are performed.
     *
     *    Note that some requests, such as INVITEs, affect several pieces of
     *    state.
     *
     * https://tools.ietf.org/html/rfc3261#section-12.2.2
     * @param message - Incoming request message within this dialog.
     */
    receiveRequest(message) {
        // ACK guard.
        // By convention, the handling of ACKs is the responsibility
        // the particular dialog implementation. For example, see SessionDialog.
        // Furthermore, ACKs have same sequence number as the associated INVITE.
        if (message.method === C.ACK) {
            return;
        }
        // If the remote sequence number was not empty, but the sequence number
        // of the request is lower than the remote sequence number, the request
        // is out of order and MUST be rejected with a 500 (Server Internal
        // Error) response.  If the remote sequence number was not empty, and
        // the sequence number of the request is greater than the remote
        // sequence number, the request is in order.  It is possible for the
        // CSeq sequence number to be higher than the remote sequence number by
        // more than one.  This is not an error condition, and a UAS SHOULD be
        // prepared to receive and process requests with CSeq values more than
        // one higher than the previous received request.  The UAS MUST then set
        // the remote sequence number to the value of the sequence number in the
        // CSeq header field value in the request.
        //
        //    If a proxy challenges a request generated by the UAC, the UAC has
        //    to resubmit the request with credentials.  The resubmitted request
        //    will have a new CSeq number.  The UAS will never see the first
        //    request, and thus, it will notice a gap in the CSeq number space.
        //    Such a gap does not represent any error condition.
        //
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (this.remoteSequenceNumber) {
            if (message.cseq <= this.remoteSequenceNumber) {
                throw new Error("Out of sequence in dialog request. Did you forget to call sequenceGuard()?");
            }
            this.dialogState.remoteSequenceNumber = message.cseq;
        }
        // If the remote sequence number is empty, it MUST be set to the value
        // of the sequence number in the CSeq header field value in the request.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (!this.remoteSequenceNumber) {
            this.dialogState.remoteSequenceNumber = message.cseq;
        }
        // When a UAS receives a target refresh request, it MUST replace the
        // dialog's remote target URI with the URI from the Contact header field
        // in that request, if present.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        // Note: "target refresh request" processing delegated to sub-class.
    }
    /**
     * If the dialog identifier in the 2xx response matches the dialog
     * identifier of an existing dialog, the dialog MUST be transitioned to
     * the "confirmed" state, and the route set for the dialog MUST be
     * recomputed based on the 2xx response using the procedures of Section
     * 12.2.1.2.  Otherwise, a new dialog in the "confirmed" state MUST be
     * constructed using the procedures of Section 12.1.2.
     *
     * Note that the only piece of state that is recomputed is the route
     * set.  Other pieces of state such as the highest sequence numbers
     * (remote and local) sent within the dialog are not recomputed.  The
     * route set only is recomputed for backwards compatibility.  RFC
     * 2543 did not mandate mirroring of the Record-Route header field in
     * a 1xx, only 2xx.  However, we cannot update the entire state of
     * the dialog, since mid-dialog requests may have been sent within
     * the early dialog, modifying the sequence numbers, for example.
     *
     *  https://tools.ietf.org/html/rfc3261#section-13.2.2.4
     */
    recomputeRouteSet(message) {
        this.dialogState.routeSet = message.getHeaders("record-route").reverse();
    }
    /**
     * A request within a dialog is constructed by using many of the
     * components of the state stored as part of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.2.1.1
     * @param method - Outgoing request method.
     */
    createOutgoingRequestMessage(method, options) {
        // The URI in the To field of the request MUST be set to the remote URI
        // from the dialog state.  The tag in the To header field of the request
        // MUST be set to the remote tag of the dialog ID.  The From URI of the
        // request MUST be set to the local URI from the dialog state.  The tag
        // in the From header field of the request MUST be set to the local tag
        // of the dialog ID.  If the value of the remote or local tags is null,
        // the tag parameter MUST be omitted from the To or From header fields,
        // respectively.
        //
        //    Usage of the URI from the To and From fields in the original
        //    request within subsequent requests is done for backwards
        //    compatibility with RFC 2543, which used the URI for dialog
        //    identification.  In this specification, only the tags are used for
        //    dialog identification.  It is expected that mandatory reflection
        //    of the original To and From URI in mid-dialog requests will be
        //    deprecated in a subsequent revision of this specification.
        // https://tools.ietf.org/html/rfc3261#section-12.2.1.1
        const toUri = this.remoteURI;
        const toTag = this.remoteTag;
        const fromUri = this.localURI;
        const fromTag = this.localTag;
        // The Call-ID of the request MUST be set to the Call-ID of the dialog.
        // Requests within a dialog MUST contain strictly monotonically
        // increasing and contiguous CSeq sequence numbers (increasing-by-one)
        // in each direction (excepting ACK and CANCEL of course, whose numbers
        // equal the requests being acknowledged or cancelled).  Therefore, if
        // the local sequence number is not empty, the value of the local
        // sequence number MUST be incremented by one, and this value MUST be
        // placed into the CSeq header field.  If the local sequence number is
        // empty, an initial value MUST be chosen using the guidelines of
        // Section 8.1.1.5.  The method field in the CSeq header field value
        // MUST match the method of the request.
        // https://tools.ietf.org/html/rfc3261#section-12.2.1.1
        const callId = this.callId;
        let cseq;
        if (options && options.cseq) {
            cseq = options.cseq;
        }
        else if (!this.dialogState.localSequenceNumber) {
            cseq = this.dialogState.localSequenceNumber = 1; // https://tools.ietf.org/html/rfc3261#section-8.1.1.5
        }
        else {
            cseq = this.dialogState.localSequenceNumber += 1;
        }
        // The UAC uses the remote target and route set to build the Request-URI
        // and Route header field of the request.
        //
        // If the route set is empty, the UAC MUST place the remote target URI
        // into the Request-URI.  The UAC MUST NOT add a Route header field to
        // the request.
        //
        // If the route set is not empty, and the first URI in the route set
        // contains the lr parameter (see Section 19.1.1), the UAC MUST place
        // the remote target URI into the Request-URI and MUST include a Route
        // header field containing the route set values in order, including all
        // parameters.
        //
        // If the route set is not empty, and its first URI does not contain the
        // lr parameter, the UAC MUST place the first URI from the route set
        // into the Request-URI, stripping any parameters that are not allowed
        // in a Request-URI.  The UAC MUST add a Route header field containing
        // the remainder of the route set values in order, including all
        // parameters.  The UAC MUST then place the remote target URI into the
        // Route header field as the last value.
        // https://tools.ietf.org/html/rfc3261#section-12.2.1.1
        // The lr parameter, when present, indicates that the element
        // responsible for this resource implements the routing mechanisms
        // specified in this document.  This parameter will be used in the
        // URIs proxies place into Record-Route header field values, and
        // may appear in the URIs in a pre-existing route set.
        //
        // This parameter is used to achieve backwards compatibility with
        // systems implementing the strict-routing mechanisms of RFC 2543
        // and the rfc2543bis drafts up to bis-05.  An element preparing
        // to send a request based on a URI not containing this parameter
        // can assume the receiving element implements strict-routing and
        // reformat the message to preserve the information in the
        // Request-URI.
        // https://tools.ietf.org/html/rfc3261#section-19.1.1
        // NOTE: Not backwards compatible with RFC 2543 (no support for strict-routing).
        const ruri = this.remoteTarget;
        const routeSet = this.routeSet;
        const extraHeaders = options && options.extraHeaders;
        const body = options && options.body;
        // The relative order of header fields with different field names is not
        // significant.  However, it is RECOMMENDED that header fields which are
        // needed for proxy processing (Via, Route, Record-Route, Proxy-Require,
        // Max-Forwards, and Proxy-Authorization, for example) appear towards
        // the top of the message to facilitate rapid parsing.
        // https://tools.ietf.org/html/rfc3261#section-7.3.1
        const message = this.userAgentCore.makeOutgoingRequestMessage(method, ruri, fromUri, toUri, {
            callId,
            cseq,
            fromTag,
            toTag,
            routeSet
        }, extraHeaders, body);
        return message;
    }
    /**
     * Increment the local sequence number by one.
     * It feels like this should be protected, but the current authentication handling currently
     * needs this to keep the dialog in sync when "auto re-sends" request messages.
     * @internal
     */
    incrementLocalSequenceNumber() {
        if (!this.dialogState.localSequenceNumber) {
            throw new Error("Local sequence number undefined.");
        }
        this.dialogState.localSequenceNumber += 1;
    }
    /**
     * If the remote sequence number was not empty, but the sequence number
     * of the request is lower than the remote sequence number, the request
     * is out of order and MUST be rejected with a 500 (Server Internal
     * Error) response.
     * https://tools.ietf.org/html/rfc3261#section-12.2.2
     * @param request - Incoming request to guard.
     * @returns True if the program execution is to continue in the branch in question.
     *          Otherwise a 500 Server Internal Error was stateless sent and request processing must stop.
     */
    sequenceGuard(message) {
        // ACK guard.
        // By convention, handling of unexpected ACKs is responsibility
        // the particular dialog implementation. For example, see SessionDialog.
        // Furthermore, we cannot reply to an "out of sequence" ACK.
        if (message.method === C.ACK) {
            return true;
        }
        // Note: We are rejecting on "less than or equal to" the remote
        // sequence number (excepting ACK whose numbers equal the requests
        // being acknowledged or cancelled), which is the correct thing to
        // do in our case. The only time a request with the same sequence number
        // will show up here if is a) it is a very late retransmission of a
        // request we already handled or b) it is a different request with the
        // same sequence number which would be violation of the standard.
        // Request retransmissions are absorbed by the transaction layer,
        // so any request with a duplicate sequence number getting here
        // would have to be a retransmission after the transaction terminated
        // or a broken request (with unique via branch value).
        // Requests within a dialog MUST contain strictly monotonically
        // increasing and contiguous CSeq sequence numbers (increasing-by-one)
        // in each direction (excepting ACK and CANCEL of course, whose numbers
        // equal the requests being acknowledged or cancelled).  Therefore, if
        // the local sequence number is not empty, the value of the local
        // sequence number MUST be incremented by one, and this value MUST be
        // placed into the CSeq header field.
        // https://tools.ietf.org/html/rfc3261#section-12.2.1.1
        if (this.remoteSequenceNumber && message.cseq <= this.remoteSequenceNumber) {
            this.core.replyStateless(message, { statusCode: 500 });
            return false;
        }
        return true;
    }
}
