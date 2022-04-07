module.export({NonInviteServerTransaction:()=>NonInviteServerTransaction});let Timers;module.link("../timers",{Timers(v){Timers=v}},0);let ServerTransaction;module.link("./server-transaction",{ServerTransaction(v){ServerTransaction=v}},1);let TransactionState;module.link("./transaction-state",{TransactionState(v){TransactionState=v}},2);


/**
 * Non-INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.2
 * @public
 */
class NonInviteServerTransaction extends ServerTransaction {
    /**
     * Constructor.
     * After construction the transaction will be in the "trying": state and the transaction
     * `id` will equal the branch parameter set in the Via header of the incoming request.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     * @param request - Incoming Non-INVITE request from the transport.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request, transport, user) {
        super(request, transport, user, TransactionState.Trying, "sip.transaction.nist");
    }
    /**
     * Destructor.
     */
    dispose() {
        if (this.J) {
            clearTimeout(this.J);
            this.J = undefined;
        }
        super.dispose();
    }
    /** Transaction kind. Deprecated. */
    get kind() {
        return "nist";
    }
    /**
     * Receive requests from transport matching this transaction.
     * @param request - Request matching this transaction.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    receiveRequest(request) {
        switch (this.state) {
            case TransactionState.Trying:
                // Once in the "Trying" state, any further request retransmissions are discarded.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                break;
            case TransactionState.Proceeding:
                // If a retransmission of the request is received while in the "Proceeding" state,
                // the most recently sent provisional response MUST be passed to the transport layer for retransmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                if (!this.lastResponse) {
                    throw new Error("Last response undefined.");
                }
                this.send(this.lastResponse).catch((error) => {
                    this.logTransportError(error, "Failed to send retransmission of provisional response.");
                });
                break;
            case TransactionState.Completed:
                // While in the "Completed" state, the server transaction MUST pass the final response to the transport
                // layer for retransmission whenever a retransmission of the request is received. Any other final responses
                // passed by the TU to the server transaction MUST be discarded while in the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                if (!this.lastResponse) {
                    throw new Error("Last response undefined.");
                }
                this.send(this.lastResponse).catch((error) => {
                    this.logTransportError(error, "Failed to send retransmission of final response.");
                });
                break;
            case TransactionState.Terminated:
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
    }
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode - Status code of response. 101-199 not allowed per RFC 4320.
     * @param response - Response to send.
     */
    receiveResponse(statusCode, response) {
        if (statusCode < 100 || statusCode > 699) {
            throw new Error(`Invalid status code ${statusCode}`);
        }
        // An SIP element MUST NOT send any provisional response with a
        // Status-Code other than 100 to a non-INVITE request.
        // An SIP element MUST NOT respond to a non-INVITE request with a
        // Status-Code of 100 over any unreliable transport, such as UDP,
        // before the amount of time it takes a client transaction's Timer E to be reset to T2.
        // An SIP element MAY respond to a non-INVITE request with a
        // Status-Code of 100 over a reliable transport at any time.
        // https://tools.ietf.org/html/rfc4320#section-4.1
        if (statusCode > 100 && statusCode <= 199) {
            throw new Error("Provisional response other than 100 not allowed.");
        }
        switch (this.state) {
            case TransactionState.Trying:
                // While in the "Trying" state, if the TU passes a provisional response
                // to the server transaction, the server transaction MUST enter the "Proceeding" state.
                // The response MUST be passed to the transport layer for transmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                this.lastResponse = response;
                if (statusCode >= 100 && statusCode < 200) {
                    this.stateTransition(TransactionState.Proceeding);
                    this.send(response).catch((error) => {
                        this.logTransportError(error, "Failed to send provisional response.");
                    });
                    return;
                }
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(TransactionState.Completed);
                    this.send(response).catch((error) => {
                        this.logTransportError(error, "Failed to send final response.");
                    });
                    return;
                }
                break;
            case TransactionState.Proceeding:
                // Any further provisional responses that are received from the TU while
                // in the "Proceeding" state MUST be passed to the transport layer for transmission.
                // If the TU passes a final response (status codes 200-699) to the server while in
                // the "Proceeding" state, the transaction MUST enter the "Completed" state, and
                // the response MUST be passed to the transport layer for transmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                this.lastResponse = response;
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(TransactionState.Completed);
                    this.send(response).catch((error) => {
                        this.logTransportError(error, "Failed to send final response.");
                    });
                    return;
                }
                break;
            case TransactionState.Completed:
                // Any other final responses passed by the TU to the server
                // transaction MUST be discarded while in the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                return;
            case TransactionState.Terminated:
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        const message = `Non-INVITE server transaction received unexpected ${statusCode} response from TU while in state ${this.state}.`;
        this.logger.error(message);
        throw new Error(message);
    }
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and SHOULD transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.4
     */
    onTransportError(error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
        this.stateTransition(TransactionState.Terminated, true);
    }
    /** For logging. */
    typeToString() {
        return "non-INVITE server transaction";
    }
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
                if (this.state !== TransactionState.Proceeding && this.state !== TransactionState.Completed) {
                    if (!dueToTransportError) {
                        invalidStateTransition();
                    }
                }
                break;
            default:
                invalidStateTransition();
        }
        // When the server transaction enters the "Completed" state, it MUST set Timer J to fire
        // in 64*T1 seconds for unreliable transports, and zero seconds for reliable transports.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        if (newState === TransactionState.Completed) {
            this.J = setTimeout(() => this.timerJ(), Timers.TIMER_J);
        }
        // The server transaction MUST be destroyed the instant it enters the "Terminated" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        if (newState === TransactionState.Terminated) {
            this.dispose();
        }
        this.setState(newState);
    }
    /**
     * The server transaction remains in this state until Timer J fires,
     * at which point it MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     */
    timerJ() {
        this.logger.debug(`Timer J expired for NON-INVITE server transaction ${this.id}.`);
        if (this.state === TransactionState.Completed) {
            this.stateTransition(TransactionState.Terminated);
        }
    }
}
