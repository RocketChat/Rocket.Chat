module.export({InviteClientTransaction:()=>InviteClientTransaction});let Timers;module.link("../timers",{Timers(v){Timers=v}},0);let ClientTransaction;module.link("./client-transaction",{ClientTransaction(v){ClientTransaction=v}},1);let TransactionState;module.link("./transaction-state",{TransactionState(v){TransactionState=v}},2);


/**
 * INVITE Client Transaction.
 * @remarks
 * The INVITE transaction consists of a three-way handshake.  The client
 * transaction sends an INVITE, the server transaction sends responses,
 * and the client transaction sends an ACK.
 * https://tools.ietf.org/html/rfc3261#section-17.1.1
 * @public
 */
class InviteClientTransaction extends ClientTransaction {
    /**
     * Constructor.
     * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
     * Then `toString` is called on the outgoing request and the message is sent via the transport.
     * After construction the transaction will be in the "calling" state and the transaction id
     * will equal the branch parameter set in the Via header of the outgoing request.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1
     * @param request - The outgoing INVITE request.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request, transport, user) {
        super(request, transport, user, TransactionState.Calling, "sip.transaction.ict");
        /**
         * Map of 2xx to-tag to ACK.
         * If value is not undefined, value is the ACK which was sent.
         * If key exists but value is undefined, a 2xx was received but the ACK not yet sent.
         * Otherwise, a 2xx was not (yet) received for this transaction.
         */
        this.ackRetransmissionCache = new Map();
        // FIXME: Timer A for unreliable transport not implemented
        //
        // If an unreliable transport is being used, the client transaction
        // MUST start timer A with a value of T1. If a reliable transport is being used,
        // the client transaction SHOULD NOT start timer A (Timer A controls request retransmissions).
        // For any transport, the client transaction MUST start timer B with a value
        // of 64*T1 seconds (Timer B controls transaction timeouts).
        // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
        //
        // While not spelled out in the RFC, Timer B is the maximum amount of time that a sender
        // will wait for an INVITE message to be acknowledged (a SIP response message is received).
        // So Timer B should be cleared when the transaction state proceeds from "Calling".
        this.B = setTimeout(() => this.timerB(), Timers.TIMER_B);
        this.send(request.toString()).catch((error) => {
            this.logTransportError(error, "Failed to send initial outgoing request.");
        });
    }
    /**
     * Destructor.
     */
    dispose() {
        if (this.B) {
            clearTimeout(this.B);
            this.B = undefined;
        }
        if (this.D) {
            clearTimeout(this.D);
            this.D = undefined;
        }
        if (this.M) {
            clearTimeout(this.M);
            this.M = undefined;
        }
        super.dispose();
    }
    /** Transaction kind. Deprecated. */
    get kind() {
        return "ict";
    }
    /**
     * ACK a 2xx final response.
     *
     * The transaction includes the ACK only if the final response was not a 2xx response (the
     * transaction will generate and send the ACK to the transport automagically). If the
     * final response was a 2xx, the ACK is not considered part of the transaction (the
     * transaction user needs to generate and send the ACK).
     *
     * This library is not strictly RFC compliant with regard to ACK handling for 2xx final
     * responses. Specifically, retransmissions of ACKs to a 2xx final responses is handled
     * by the transaction layer (instead of the UAC core). The "standard" approach is for
     * the UAC core to receive all 2xx responses and manage sending ACK retransmissions to
     * the transport directly. Herein the transaction layer manages sending ACKs to 2xx responses
     * and any retransmissions of those ACKs as needed.
     *
     * @param ack - The outgoing ACK request.
     */
    ackResponse(ack) {
        const toTag = ack.toTag;
        if (!toTag) {
            throw new Error("To tag undefined.");
        }
        const id = "z9hG4bK" + Math.floor(Math.random() * 10000000);
        ack.setViaHeader(id, this.transport.protocol);
        this.ackRetransmissionCache.set(toTag, ack); // Add to ACK retransmission cache
        this.send(ack.toString()).catch((error) => {
            this.logTransportError(error, "Failed to send ACK to 2xx response.");
        });
    }
    /**
     * Handler for incoming responses from the transport which match this transaction.
     * @param response - The incoming response.
     */
    receiveResponse(response) {
        const statusCode = response.statusCode;
        if (!statusCode || statusCode < 100 || statusCode > 699) {
            throw new Error(`Invalid status code ${statusCode}`);
        }
        switch (this.state) {
            case TransactionState.Calling:
                // If the client transaction receives a provisional response while in
                // the "Calling" state, it transitions to the "Proceeding" state. In the
                // "Proceeding" state, the client transaction SHOULD NOT retransmit the
                // request any longer. Furthermore, the provisional response MUST be
                // passed to the TU.  Any further provisional responses MUST be passed
                // up to the TU while in the "Proceeding" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
                if (statusCode >= 100 && statusCode <= 199) {
                    this.stateTransition(TransactionState.Proceeding);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // When a 2xx response is received while in either the "Calling" or
                // "Proceeding" states, the client transaction MUST transition to
                // the "Accepted" state... The 2xx response MUST be passed up to the TU.
                // The client transaction MUST NOT generate an ACK to the 2xx response -- its
                // handling is delegated to the TU. A UAC core will send an ACK to
                // the 2xx response using a new transaction.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 200 && statusCode <= 299) {
                    this.ackRetransmissionCache.set(response.toTag, undefined); // Prime the ACK cache
                    this.stateTransition(TransactionState.Accepted);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // When in either the "Calling" or "Proceeding" states, reception of
                // a response with status code from 300-699 MUST cause the client
                // transaction to transition to "Completed". The client transaction
                // MUST pass the received response up to the TU, and the client
                // transaction MUST generate an ACK request, even if the transport is
                // reliable (guidelines for constructing the ACK from the response
                // are given in Section 17.1.1.3), and then pass the ACK to the
                // transport layer for transmission. The ACK MUST be sent to the
                // same address, port, and transport to which the original request was sent.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 300 && statusCode <= 699) {
                    this.stateTransition(TransactionState.Completed);
                    this.ack(response);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                break;
            case TransactionState.Proceeding:
                // In the "Proceeding" state, the client transaction SHOULD NOT retransmit the
                // request any longer. Furthermore, the provisional response MUST be
                // passed to the TU.  Any further provisional responses MUST be passed
                // up to the TU while in the "Proceeding" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
                if (statusCode >= 100 && statusCode <= 199) {
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // When a 2xx response is received while in either the "Calling" or "Proceeding" states,
                // the client transaction MUST transition to the "Accepted" state...
                // The 2xx response MUST be passed up to the TU. The client
                // transaction MUST NOT generate an ACK to the 2xx response -- its
                // handling is delegated to the TU. A UAC core will send an ACK to
                // the 2xx response using a new transaction.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 200 && statusCode <= 299) {
                    this.ackRetransmissionCache.set(response.toTag, undefined); // Prime the ACK cache
                    this.stateTransition(TransactionState.Accepted);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // When in either the "Calling" or "Proceeding" states, reception of
                // a response with status code from 300-699 MUST cause the client
                // transaction to transition to "Completed". The client transaction
                // MUST pass the received response up to the TU, and the client
                // transaction MUST generate an ACK request, even if the transport is
                // reliable (guidelines for constructing the ACK from the response
                // are given in Section 17.1.1.3), and then pass the ACK to the
                // transport layer for transmission. The ACK MUST be sent to the
                // same address, port, and transport to which the original request was sent.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 300 && statusCode <= 699) {
                    this.stateTransition(TransactionState.Completed);
                    this.ack(response);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                break;
            case TransactionState.Accepted:
                // The purpose of the "Accepted" state is to allow the client
                // transaction to continue to exist to receive, and pass to the TU,
                // any retransmissions of the 2xx response and any additional 2xx
                // responses from other branches of the INVITE if it forked
                // downstream. Timer M reflects the amount of time that the
                // transaction user will wait for such messages.
                //
                // Any 2xx responses that match this client transaction and that are
                // received while in the "Accepted" state MUST be passed up to the
                // TU. The client transaction MUST NOT generate an ACK to the 2xx
                // response. The client transaction takes no further action.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 200 && statusCode <= 299) {
                    // NOTE: This implementation herein is intentionally not RFC compliant.
                    // While the first 2xx response for a given branch is passed up to the TU,
                    // retransmissions of 2xx responses are absorbed and the ACK associated
                    // with the original response is resent. This approach is taken because
                    // our current transaction users are not currently in a good position to
                    // deal with 2xx retransmission. This SHOULD NOT cause any compliance issues - ;)
                    //
                    // If we don't have a cache hit, pass the response to the TU.
                    if (!this.ackRetransmissionCache.has(response.toTag)) {
                        this.ackRetransmissionCache.set(response.toTag, undefined); // Prime the ACK cache
                        if (this.user.receiveResponse) {
                            this.user.receiveResponse(response);
                        }
                        return;
                    }
                    // If we have a cache hit, try pulling the ACK from cache and retransmitting it.
                    const ack = this.ackRetransmissionCache.get(response.toTag);
                    if (ack) {
                        this.send(ack.toString()).catch((error) => {
                            this.logTransportError(error, "Failed to send retransmission of ACK to 2xx response.");
                        });
                        return;
                    }
                    // If an ACK was not found in cache then we have received a retransmitted 2xx
                    // response before the TU responded to the original response (we don't have an ACK yet).
                    // So discard this response under the assumption that the TU will eventually
                    // get us a ACK for the original response.
                    return;
                }
                break;
            case TransactionState.Completed:
                // Any retransmissions of a response with status code 300-699 that
                // are received while in the "Completed" state MUST cause the ACK to
                // be re-passed to the transport layer for retransmission, but the
                // newly received response MUST NOT be passed up to the TU.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 300 && statusCode <= 699) {
                    this.ack(response);
                    return;
                }
                break;
            case TransactionState.Terminated:
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        // Any response received that does not match an existing client
        // transaction state machine is simply dropped. (Implementations are,
        // of course, free to log or do other implementation-specific things
        // with such responses, but the implementer should be sure to consider
        // the impact of large numbers of malicious stray responses.)
        // https://tools.ietf.org/html/rfc6026#section-7.2
        const message = `Received unexpected ${statusCode} response while in state ${this.state}.`;
        this.logger.warn(message);
        return;
    }
    /**
     * The client transaction SHOULD inform the TU that a transport failure
     * has occurred, and the client transaction SHOULD transition directly
     * to the "Terminated" state.  The TU will handle the failover
     * mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error - The error.
     */
    onTransportError(error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
        this.stateTransition(TransactionState.Terminated, true);
    }
    /** For logging. */
    typeToString() {
        return "INVITE client transaction";
    }
    ack(response) {
        // The ACK request constructed by the client transaction MUST contain
        // values for the Call-ID, From, and Request-URI that are equal to the
        // values of those header fields in the request passed to the transport
        // by the client transaction (call this the "original request"). The To
        // header field in the ACK MUST equal the To header field in the
        // response being acknowledged, and therefore will usually differ from
        // the To header field in the original request by the addition of the
        // tag parameter. The ACK MUST contain a single Via header field, and
        // this MUST be equal to the top Via header field of the original
        // request. The CSeq header field in the ACK MUST contain the same
        // value for the sequence number as was present in the original request,
        // but the method parameter MUST be equal to "ACK".
        //
        // If the INVITE request whose response is being acknowledged had Route
        // header fields, those header fields MUST appear in the ACK. This is
        // to ensure that the ACK can be routed properly through any downstream
        // stateless proxies.
        // https://tools.ietf.org/html/rfc3261#section-17.1.1.3
        const ruri = this.request.ruri;
        const callId = this.request.callId;
        const cseq = this.request.cseq;
        const from = this.request.getHeader("from");
        const to = response.getHeader("to");
        const via = this.request.getHeader("via");
        const route = this.request.getHeader("route");
        if (!from) {
            throw new Error("From undefined.");
        }
        if (!to) {
            throw new Error("To undefined.");
        }
        if (!via) {
            throw new Error("Via undefined.");
        }
        let ack = `ACK ${ruri} SIP/2.0\r\n`;
        if (route) {
            ack += `Route: ${route}\r\n`;
        }
        ack += `Via: ${via}\r\n`;
        ack += `To: ${to}\r\n`;
        ack += `From: ${from}\r\n`;
        ack += `Call-ID: ${callId}\r\n`;
        ack += `CSeq: ${cseq} ACK\r\n`;
        ack += `Max-Forwards: 70\r\n`;
        ack += `Content-Length: 0\r\n\r\n`;
        // TOOO: "User-Agent" header
        this.send(ack).catch((error) => {
            this.logTransportError(error, "Failed to send ACK to non-2xx response.");
        });
        return;
    }
    /**
     * Execute a state transition.
     * @param newState - New state.
     */
    stateTransition(newState, dueToTransportError = false) {
        // Assert valid state transitions.
        const invalidStateTransition = () => {
            throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
        };
        switch (newState) {
            case TransactionState.Calling:
                invalidStateTransition();
                break;
            case TransactionState.Proceeding:
                if (this.state !== TransactionState.Calling) {
                    invalidStateTransition();
                }
                break;
            case TransactionState.Accepted:
            case TransactionState.Completed:
                if (this.state !== TransactionState.Calling && this.state !== TransactionState.Proceeding) {
                    invalidStateTransition();
                }
                break;
            case TransactionState.Terminated:
                if (this.state !== TransactionState.Calling &&
                    this.state !== TransactionState.Accepted &&
                    this.state !== TransactionState.Completed) {
                    if (!dueToTransportError) {
                        invalidStateTransition();
                    }
                }
                break;
            default:
                invalidStateTransition();
        }
        // While not spelled out in the RFC, Timer B is the maximum amount of time that a sender
        // will wait for an INVITE message to be acknowledged (a SIP response message is received).
        // So Timer B should be cleared when the transaction state proceeds from "Calling".
        if (this.B) {
            clearTimeout(this.B);
            this.B = undefined;
        }
        if (newState === TransactionState.Proceeding) {
            // Timers have no effect on "Proceeding" state.
            // In the "Proceeding" state, the client transaction
            // SHOULD NOT retransmit the request any longer.
            // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
        }
        // The client transaction MUST start Timer D when it enters the "Completed" state
        // for any reason, with a value of at least 32 seconds for unreliable transports,
        // and a value of zero seconds for reliable transports.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (newState === TransactionState.Completed) {
            this.D = setTimeout(() => this.timerD(), Timers.TIMER_D);
        }
        // The client transaction MUST transition to the "Accepted" state,
        // and Timer M MUST be started with a value of 64*T1.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (newState === TransactionState.Accepted) {
            this.M = setTimeout(() => this.timerM(), Timers.TIMER_M);
        }
        // Once the transaction is in the "Terminated" state, it MUST be destroyed immediately.
        // https://tools.ietf.org/html/rfc6026#section-8.7
        if (newState === TransactionState.Terminated) {
            this.dispose();
        }
        // Update state.
        this.setState(newState);
    }
    /**
     * When timer A fires, the client transaction MUST retransmit the
     * request by passing it to the transport layer, and MUST reset the
     * timer with a value of 2*T1.
     * When timer A fires 2*T1 seconds later, the request MUST be
     * retransmitted again (assuming the client transaction is still in this
     * state). This process MUST continue so that the request is
     * retransmitted with intervals that double after each transmission.
     * These retransmissions SHOULD only be done while the client
     * transaction is in the "Calling" state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1.2
     */
    timerA() {
        // TODO
    }
    /**
     * If the client transaction is still in the "Calling" state when timer
     * B fires, the client transaction SHOULD inform the TU that a timeout
     * has occurred.  The client transaction MUST NOT generate an ACK.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1.2
     */
    timerB() {
        this.logger.debug(`Timer B expired for INVITE client transaction ${this.id}.`);
        if (this.state === TransactionState.Calling) {
            this.onRequestTimeout();
            this.stateTransition(TransactionState.Terminated);
        }
    }
    /**
     * If Timer D fires while the client transaction is in the "Completed" state,
     * the client transaction MUST move to the "Terminated" state.
     * https://tools.ietf.org/html/rfc6026#section-8.4
     */
    timerD() {
        this.logger.debug(`Timer D expired for INVITE client transaction ${this.id}.`);
        if (this.state === TransactionState.Completed) {
            this.stateTransition(TransactionState.Terminated);
        }
    }
    /**
     * If Timer M fires while the client transaction is in the "Accepted"
     * state, the client transaction MUST move to the "Terminated" state.
     * https://tools.ietf.org/html/rfc6026#section-8.4
     */
    timerM() {
        this.logger.debug(`Timer M expired for INVITE client transaction ${this.id}.`);
        if (this.state === TransactionState.Accepted) {
            this.stateTransition(TransactionState.Terminated);
        }
    }
}
