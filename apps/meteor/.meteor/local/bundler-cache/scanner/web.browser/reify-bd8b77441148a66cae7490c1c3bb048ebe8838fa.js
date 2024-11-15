module.export({InviteServerTransaction:()=>InviteServerTransaction});let C;module.link("../messages",{C(v){C=v}},0);let Timers;module.link("../timers",{Timers(v){Timers=v}},1);let ServerTransaction;module.link("./server-transaction",{ServerTransaction(v){ServerTransaction=v}},2);let TransactionState;module.link("./transaction-state",{TransactionState(v){TransactionState=v}},3);



/**
 * INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.1
 * @public
 */
class InviteServerTransaction extends ServerTransaction {
    /**
     * Constructor.
     * Upon construction, a "100 Trying" reply will be immediately sent.
     * After construction the transaction will be in the "proceeding" state and the transaction
     * `id` will equal the branch parameter set in the Via header of the incoming request.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     * @param request - Incoming INVITE request from the transport.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request, transport, user) {
        super(request, transport, user, TransactionState.Proceeding, "sip.transaction.ist");
    }
    /**
     * Destructor.
     */
    dispose() {
        this.stopProgressExtensionTimer();
        if (this.H) {
            clearTimeout(this.H);
            this.H = undefined;
        }
        if (this.I) {
            clearTimeout(this.I);
            this.I = undefined;
        }
        if (this.L) {
            clearTimeout(this.L);
            this.L = undefined;
        }
        super.dispose();
    }
    /** Transaction kind. Deprecated. */
    get kind() {
        return "ist";
    }
    /**
     * Receive requests from transport matching this transaction.
     * @param request - Request matching this transaction.
     */
    receiveRequest(request) {
        switch (this.state) {
            case TransactionState.Proceeding:
                // If a request retransmission is received while in the "Proceeding" state, the most
                // recent provisional response that was received from the TU MUST be passed to the
                // transport layer for retransmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (request.method === C.INVITE) {
                    if (this.lastProvisionalResponse) {
                        this.send(this.lastProvisionalResponse).catch((error) => {
                            this.logTransportError(error, "Failed to send retransmission of provisional response.");
                        });
                    }
                    return;
                }
                break;
            case TransactionState.Accepted:
                // While in the "Accepted" state, any retransmissions of the INVITE
                // received will match this transaction state machine and will be
                // absorbed by the machine without changing its state. These
                // retransmissions are not passed onto the TU.
                // https://tools.ietf.org/html/rfc6026#section-7.1
                if (request.method === C.INVITE) {
                    return;
                }
                break;
            case TransactionState.Completed:
                // Furthermore, while in the "Completed" state, if a request retransmission is
                // received, the server SHOULD pass the response to the transport for retransmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (request.method === C.INVITE) {
                    if (!this.lastFinalResponse) {
                        throw new Error("Last final response undefined.");
                    }
                    this.send(this.lastFinalResponse).catch((error) => {
                        this.logTransportError(error, "Failed to send retransmission of final response.");
                    });
                    return;
                }
                // If an ACK is received while the server transaction is in the "Completed" state,
                // the server transaction MUST transition to the "Confirmed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (request.method === C.ACK) {
                    this.stateTransition(TransactionState.Confirmed);
                    return;
                }
                break;
            case TransactionState.Confirmed:
                // The purpose of the "Confirmed" state is to absorb any additional ACK messages that arrive,
                // triggered from retransmissions of the final response.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (request.method === C.INVITE || request.method === C.ACK) {
                    return;
                }
                break;
            case TransactionState.Terminated:
                // For good measure absorb any additional messages that arrive (should not happen).
                if (request.method === C.INVITE || request.method === C.ACK) {
                    return;
                }
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        const message = `INVITE server transaction received unexpected ${request.method} request while in state ${this.state}.`;
        this.logger.warn(message);
        return;
    }
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode - Status code of response.
     * @param response - Response.
     */
    receiveResponse(statusCode, response) {
        if (statusCode < 100 || statusCode > 699) {
            throw new Error(`Invalid status code ${statusCode}`);
        }
        switch (this.state) {
            case TransactionState.Proceeding:
                // The TU passes any number of provisional responses to the server
                // transaction. So long as the server transaction is in the
                // "Proceeding" state, each of these MUST be passed to the transport
                // layer for transmission. They are not sent reliably by the
                // transaction layer (they are not retransmitted by it) and do not cause
                // a change in the state of the server transaction.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (statusCode >= 100 && statusCode <= 199) {
                    this.lastProvisionalResponse = response;
                    // Start the progress extension timer only for a non-100 provisional response.
                    if (statusCode > 100) {
                        this.startProgressExtensionTimer(); // FIXME: remove
                    }
                    this.send(response).catch((error) => {
                        this.logTransportError(error, "Failed to send 1xx response.");
                    });
                    return;
                }
                // If, while in the "Proceeding" state, the TU passes a 2xx response
                // to the server transaction, the server transaction MUST pass this
                // response to the transport layer for transmission. It is not
                // retransmitted by the server transaction; retransmissions of 2xx
                // responses are handled by the TU. The server transaction MUST then
                // transition to the "Accepted" state.
                // https://tools.ietf.org/html/rfc6026#section-8.5
                if (statusCode >= 200 && statusCode <= 299) {
                    this.lastFinalResponse = response;
                    this.stateTransition(TransactionState.Accepted);
                    this.send(response).catch((error) => {
                        this.logTransportError(error, "Failed to send 2xx response.");
                    });
                    return;
                }
                // While in the "Proceeding" state, if the TU passes a response with
                // status code from 300 to 699 to the server transaction, the response
                // MUST be passed to the transport layer for transmission, and the state
                // machine MUST enter the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (statusCode >= 300 && statusCode <= 699) {
                    this.lastFinalResponse = response;
                    this.stateTransition(TransactionState.Completed);
                    this.send(response).catch((error) => {
                        this.logTransportError(error, "Failed to send non-2xx final response.");
                    });
                    return;
                }
                break;
            case TransactionState.Accepted:
                // While in the "Accepted" state, if the TU passes a 2xx response,
                // the server transaction MUST pass the response to the transport layer for transmission.
                // https://tools.ietf.org/html/rfc6026#section-8.7
                if (statusCode >= 200 && statusCode <= 299) {
                    this.send(response).catch((error) => {
                        this.logTransportError(error, "Failed to send 2xx response.");
                    });
                    return;
                }
                break;
            case TransactionState.Completed:
                break;
            case TransactionState.Confirmed:
                break;
            case TransactionState.Terminated:
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        const message = `INVITE server transaction received unexpected ${statusCode} response from TU while in state ${this.state}.`;
        this.logger.error(message);
        throw new Error(message);
    }
    /**
     * Retransmit the last 2xx response. This is a noop if not in the "accepted" state.
     */
    retransmitAcceptedResponse() {
        if (this.state === TransactionState.Accepted && this.lastFinalResponse) {
            this.send(this.lastFinalResponse).catch((error) => {
                this.logTransportError(error, "Failed to send 2xx response.");
            });
        }
    }
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and MUST remain in the current state.
     * https://tools.ietf.org/html/rfc6026#section-8.8
     */
    onTransportError(error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
    }
    /** For logging. */
    typeToString() {
        return "INVITE server transaction";
    }
    /**
     * Execute a state transition.
     * @param newState - New state.
     */
    stateTransition(newState) {
        // Assert valid state transitions.
        const invalidStateTransition = () => {
            throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
        };
        switch (newState) {
            case TransactionState.Proceeding:
                invalidStateTransition();
                break;
            case TransactionState.Accepted:
            case TransactionState.Completed:
                if (this.state !== TransactionState.Proceeding) {
                    invalidStateTransition();
                }
                break;
            case TransactionState.Confirmed:
                if (this.state !== TransactionState.Completed) {
                    invalidStateTransition();
                }
                break;
            case TransactionState.Terminated:
                if (this.state !== TransactionState.Accepted &&
                    this.state !== TransactionState.Completed &&
                    this.state !== TransactionState.Confirmed) {
                    invalidStateTransition();
                }
                break;
            default:
                invalidStateTransition();
        }
        // On any state transition, stop resending provisional responses
        this.stopProgressExtensionTimer();
        // The purpose of the "Accepted" state is to absorb retransmissions of an accepted INVITE request.
        // Any such retransmissions are absorbed entirely within the server transaction.
        // They are not passed up to the TU since any downstream UAS cores that accepted the request have
        // taken responsibility for reliability and will already retransmit their 2xx responses if necessary.
        // https://tools.ietf.org/html/rfc6026#section-8.7
        if (newState === TransactionState.Accepted) {
            this.L = setTimeout(() => this.timerL(), Timers.TIMER_L);
        }
        // When the "Completed" state is entered, timer H MUST be set to fire in 64*T1 seconds for all transports.
        // Timer H determines when the server transaction abandons retransmitting the response.
        // If an ACK is received while the server transaction is in the "Completed" state,
        // the server transaction MUST transition to the "Confirmed" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (newState === TransactionState.Completed) {
            // FIXME: Missing timer G for unreliable transports.
            this.H = setTimeout(() => this.timerH(), Timers.TIMER_H);
        }
        // The purpose of the "Confirmed" state is to absorb any additional ACK messages that arrive,
        // triggered from retransmissions of the final response. When this state is entered, timer I
        // is set to fire in T4 seconds for unreliable transports, and zero seconds for reliable
        // transports. Once timer I fires, the server MUST transition to the "Terminated" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (newState === TransactionState.Confirmed) {
            // FIXME: This timer is not getting set correctly for unreliable transports.
            this.I = setTimeout(() => this.timerI(), Timers.TIMER_I);
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
     * FIXME: UAS Provisional Retransmission Timer. See RFC 3261 Section 13.3.1.1
     * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
     */
    startProgressExtensionTimer() {
        // Start the progress extension timer only for the first non-100 provisional response.
        if (this.progressExtensionTimer === undefined) {
            this.progressExtensionTimer = setInterval(() => {
                this.logger.debug(`Progress extension timer expired for INVITE server transaction ${this.id}.`);
                if (!this.lastProvisionalResponse) {
                    throw new Error("Last provisional response undefined.");
                }
                this.send(this.lastProvisionalResponse).catch((error) => {
                    this.logTransportError(error, "Failed to send retransmission of provisional response.");
                });
            }, Timers.PROVISIONAL_RESPONSE_INTERVAL);
        }
    }
    /**
     * FIXME: UAS Provisional Retransmission Timer id. See RFC 3261 Section 13.3.1.1
     * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
     */
    stopProgressExtensionTimer() {
        if (this.progressExtensionTimer !== undefined) {
            clearInterval(this.progressExtensionTimer);
            this.progressExtensionTimer = undefined;
        }
    }
    /**
     * While in the "Proceeding" state, if the TU passes a response with status code
     * from 300 to 699 to the server transaction, the response MUST be passed to the
     * transport layer for transmission, and the state machine MUST enter the "Completed" state.
     * For unreliable transports, timer G is set to fire in T1 seconds, and is not set to fire for
     * reliable transports. If timer G fires, the response is passed to the transport layer once
     * more for retransmission, and timer G is set to fire in MIN(2*T1, T2) seconds. From then on,
     * when timer G fires, the response is passed to the transport again for transmission, and
     * timer G is reset with a value that doubles, unless that value exceeds T2, in which case
     * it is reset with the value of T2.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    timerG() {
        // TODO
    }
    /**
     * If timer H fires while in the "Completed" state, it implies that the ACK was never received.
     * In this case, the server transaction MUST transition to the "Terminated" state, and MUST
     * indicate to the TU that a transaction failure has occurred.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    timerH() {
        this.logger.debug(`Timer H expired for INVITE server transaction ${this.id}.`);
        if (this.state === TransactionState.Completed) {
            this.logger.warn("ACK to negative final response was never received, terminating transaction.");
            this.stateTransition(TransactionState.Terminated);
        }
    }
    /**
     * Once timer I fires, the server MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    timerI() {
        this.logger.debug(`Timer I expired for INVITE server transaction ${this.id}.`);
        this.stateTransition(TransactionState.Terminated);
    }
    /**
     * When Timer L fires and the state machine is in the "Accepted" state, the machine MUST
     * transition to the "Terminated" state. Once the transaction is in the "Terminated" state,
     * it MUST be destroyed immediately. Timer L reflects the amount of time the server
     * transaction could receive 2xx responses for retransmission from the
     * TU while it is waiting to receive an ACK.
     * https://tools.ietf.org/html/rfc6026#section-7.1
     * https://tools.ietf.org/html/rfc6026#section-8.7
     */
    timerL() {
        this.logger.debug(`Timer L expired for INVITE server transaction ${this.id}.`);
        if (this.state === TransactionState.Accepted) {
            this.stateTransition(TransactionState.Terminated);
        }
    }
}
