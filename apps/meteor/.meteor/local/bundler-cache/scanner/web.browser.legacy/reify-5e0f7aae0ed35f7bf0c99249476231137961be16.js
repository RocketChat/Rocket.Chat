module.export({NonInviteClientTransaction:function(){return NonInviteClientTransaction}});var Timers;module.link("../timers",{Timers:function(v){Timers=v}},0);var ClientTransaction;module.link("./client-transaction",{ClientTransaction:function(v){ClientTransaction=v}},1);var TransactionState;module.link("./transaction-state",{TransactionState:function(v){TransactionState=v}},2);


/**
 * Non-INVITE Client Transaction.
 * @remarks
 * Non-INVITE transactions do not make use of ACK.
 * They are simple request-response interactions.
 * https://tools.ietf.org/html/rfc3261#section-17.1.2
 * @public
 */
class NonInviteClientTransaction extends ClientTransaction {
    /**
     * Constructor
     * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
     * Then `toString` is called on the outgoing request and the message is sent via the transport.
     * After construction the transaction will be in the "calling" state and the transaction id
     * will equal the branch parameter set in the Via header of the outgoing request.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2
     * @param request - The outgoing Non-INVITE request.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request, transport, user) {
        super(request, transport, user, TransactionState.Trying, "sip.transaction.nict");
        // FIXME: Timer E for unreliable transports not implemented.
        //
        // The "Trying" state is entered when the TU initiates a new client
        // transaction with a request.  When entering this state, the client
        // transaction SHOULD set timer F to fire in 64*T1 seconds. The request
        // MUST be passed to the transport layer for transmission.
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        this.F = setTimeout(() => this.timerF(), Timers.TIMER_F);
        this.send(request.toString()).catch((error) => {
            this.logTransportError(error, "Failed to send initial outgoing request.");
        });
    }
    /**
     * Destructor.
     */
    dispose() {
        if (this.F) {
            clearTimeout(this.F);
            this.F = undefined;
        }
        if (this.K) {
            clearTimeout(this.K);
            this.K = undefined;
        }
        super.dispose();
    }
    /** Transaction kind. Deprecated. */
    get kind() {
        return "nict";
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
            case TransactionState.Trying:
                // If a provisional response is received while in the "Trying" state, the
                // response MUST be passed to the TU, and then the client transaction
                // SHOULD move to the "Proceeding" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 100 && statusCode <= 199) {
                    this.stateTransition(TransactionState.Proceeding);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // If a final response (status codes 200-699) is received while in the
                // "Trying" state, the response MUST be passed to the TU, and the
                // client transaction MUST transition to the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(TransactionState.Completed);
                    if (statusCode === 408) {
                        this.onRequestTimeout();
                        return;
                    }
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                break;
            case TransactionState.Proceeding:
                // If a provisional response is received while in the "Proceeding" state,
                // the response MUST be passed to the TU. (From Figure 6)
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 100 && statusCode <= 199) {
                    if (this.user.receiveResponse) {
                        return this.user.receiveResponse(response);
                    }
                }
                // If a final response (status codes 200-699) is received while in the
                // "Proceeding" state, the response MUST be passed to the TU, and the
                // client transaction MUST transition to the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(TransactionState.Completed);
                    if (statusCode === 408) {
                        this.onRequestTimeout();
                        return;
                    }
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                break;
            case TransactionState.Completed:
                // The "Completed" state exists to buffer any additional response
                // retransmissions that may be received (which is why the client
                // transaction remains there only for unreliable transports).
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                return;
            case TransactionState.Terminated:
                // For good measure just absorb additional response retransmissions.
                return;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        const message = `Non-INVITE client transaction received unexpected ${statusCode} response while in state ${this.state}.`;
        this.logger.warn(message);
        return;
    }
    /**
     * The client transaction SHOULD inform the TU that a transport failure has occurred,
     * and the client transaction SHOULD transition directly to the "Terminated" state.
     * The TU will handle the fail over mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error - Transport error
     */
    onTransportError(error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
        this.stateTransition(TransactionState.Terminated, true);
    }
    /** For logging. */
    typeToString() {
        return "non-INVITE client transaction";
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
            case TransactionState.Trying:
                invalidStateTransition();
                break;
            case TransactionState.Proceeding:
                if (this.state !== TransactionState.Trying) {
                    invalidStateTransition();
                }
                break;
            case TransactionState.Completed:
                if (this.state !== TransactionState.Trying && this.state !== TransactionState.Proceeding) {
                    invalidStateTransition();
                }
                break;
            case TransactionState.Terminated:
                if (this.state !== TransactionState.Trying &&
                    this.state !== TransactionState.Proceeding &&
                    this.state !== TransactionState.Completed) {
                    if (!dueToTransportError) {
                        invalidStateTransition();
                    }
                }
                break;
            default:
                invalidStateTransition();
        }
        // Once the client transaction enters the "Completed" state, it MUST set
        // Timer K to fire in T4 seconds for unreliable transports, and zero
        // seconds for reliable transports  The "Completed" state exists to
        // buffer any additional response retransmissions that may be received
        // (which is why the client transaction remains there only for unreliable transports).
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (newState === TransactionState.Completed) {
            if (this.F) {
                clearTimeout(this.F);
                this.F = undefined;
            }
            this.K = setTimeout(() => this.timerK(), Timers.TIMER_K);
        }
        // Once the transaction is in the terminated state, it MUST be destroyed immediately.
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (newState === TransactionState.Terminated) {
            this.dispose();
        }
        // Update state.
        this.setState(newState);
    }
    /**
     * If Timer F fires while the client transaction is still in the
     * "Trying" state, the client transaction SHOULD inform the TU about the
     * timeout, and then it SHOULD enter the "Terminated" state.
     * If timer F fires while in the "Proceeding" state, the TU MUST be informed of
     * a timeout, and the client transaction MUST transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    timerF() {
        this.logger.debug(`Timer F expired for non-INVITE client transaction ${this.id}.`);
        if (this.state === TransactionState.Trying || this.state === TransactionState.Proceeding) {
            this.onRequestTimeout();
            this.stateTransition(TransactionState.Terminated);
        }
    }
    /**
     * If Timer K fires while in this (COMPLETED) state, the client transaction
     * MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    timerK() {
        if (this.state === TransactionState.Completed) {
            this.stateTransition(TransactionState.Terminated);
        }
    }
}
