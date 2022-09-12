module.export({InviteUserAgentClient:()=>InviteUserAgentClient});let Dialog,SessionDialog;module.link("../dialogs",{Dialog(v){Dialog=v},SessionDialog(v){SessionDialog=v}},0);let SignalingState;module.link("../session",{SignalingState(v){SignalingState=v}},1);let InviteClientTransaction,TransactionState;module.link("../transactions",{InviteClientTransaction(v){InviteClientTransaction=v},TransactionState(v){TransactionState=v}},2);let UserAgentClient;module.link("./user-agent-client",{UserAgentClient(v){UserAgentClient=v}},3);



/**
 * INVITE UAC.
 * @remarks
 * 13 Initiating a Session
 * https://tools.ietf.org/html/rfc3261#section-13
 * 13.1 Overview
 * https://tools.ietf.org/html/rfc3261#section-13.1
 * 13.2 UAC Processing
 * https://tools.ietf.org/html/rfc3261#section-13.2
 * @public
 */
class InviteUserAgentClient extends UserAgentClient {
    constructor(core, message, delegate) {
        super(InviteClientTransaction, core, message, delegate);
        this.confirmedDialogAcks = new Map();
        this.confirmedDialogs = new Map();
        this.earlyDialogs = new Map();
        this.delegate = delegate;
    }
    dispose() {
        // The UAC core considers the INVITE transaction completed 64*T1 seconds
        // after the reception of the first 2xx response.  At this point all the
        // early dialogs that have not transitioned to established dialogs are
        // terminated.  Once the INVITE transaction is considered completed by
        // the UAC core, no more new 2xx responses are expected to arrive.
        //
        // If, after acknowledging any 2xx response to an INVITE, the UAC does
        // not want to continue with that dialog, then the UAC MUST terminate
        // the dialog by sending a BYE request as described in Section 15.
        // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
        this.earlyDialogs.forEach((earlyDialog) => earlyDialog.dispose());
        this.earlyDialogs.clear();
        super.dispose();
    }
    /**
     * Special case for transport error while sending ACK.
     * @param error - Transport error
     */
    onTransportError(error) {
        if (this.transaction.state === TransactionState.Calling) {
            return super.onTransportError(error);
        }
        // If not in 'calling' state, the transport error occurred while sending an ACK.
        this.logger.error(error.message);
        this.logger.error("User agent client request transport error while sending ACK.");
    }
    /**
     * Once the INVITE has been passed to the INVITE client transaction, the
     * UAC waits for responses for the INVITE.
     * https://tools.ietf.org/html/rfc3261#section-13.2.2
     * @param incomingResponse - Incoming response to INVITE request.
     */
    receiveResponse(message) {
        if (!this.authenticationGuard(message)) {
            return;
        }
        const statusCode = message.statusCode ? message.statusCode.toString() : "";
        if (!statusCode) {
            throw new Error("Response status code undefined.");
        }
        switch (true) {
            case /^100$/.test(statusCode):
                if (this.delegate && this.delegate.onTrying) {
                    this.delegate.onTrying({ message });
                }
                return;
            case /^1[0-9]{2}$/.test(statusCode):
                // Zero, one or multiple provisional responses may arrive before one or
                // more final responses are received.  Provisional responses for an
                // INVITE request can create "early dialogs".  If a provisional response
                // has a tag in the To field, and if the dialog ID of the response does
                // not match an existing dialog, one is constructed using the procedures
                // defined in Section 12.1.2.
                //
                // The early dialog will only be needed if the UAC needs to send a
                // request to its peer within the dialog before the initial INVITE
                // transaction completes.  Header fields present in a provisional
                // response are applicable as long as the dialog is in the early state
                // (for example, an Allow header field in a provisional response
                // contains the methods that can be used in the dialog while this is in
                // the early state).
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.1
                {
                    // Dialogs are created through the generation of non-failure responses
                    // to requests with specific methods.  Within this specification, only
                    // 2xx and 101-199 responses with a To tag, where the request was
                    // INVITE, will establish a dialog.  A dialog established by a non-final
                    // response to a request is in the "early" state and it is called an
                    // early dialog.
                    // https://tools.ietf.org/html/rfc3261#section-12.1
                    // Provisional without to tag, no dialog to create.
                    if (!message.toTag) {
                        this.logger.warn("Non-100 1xx INVITE response received without a to tag, dropping.");
                        return;
                    }
                    // When a UAS responds to a request with a response that establishes a
                    // dialog (such as a 2xx to INVITE), the UAS MUST copy all Record-Route
                    // header field values from the request into the response (including the
                    // URIs, URI parameters, and any Record-Route header field parameters,
                    // whether they are known or unknown to the UAS) and MUST maintain the
                    // order of those values.  The UAS MUST add a Contact header field to
                    // the response.
                    // https://tools.ietf.org/html/rfc3261#section-12.1.1
                    // Provisional without Contact header field, malformed response.
                    const contact = message.parseHeader("contact");
                    if (!contact) {
                        this.logger.error("Non-100 1xx INVITE response received without a Contact header field, dropping.");
                        return;
                    }
                    // Compute dialog state.
                    const dialogState = Dialog.initialDialogStateForUserAgentClient(this.message, message);
                    // Have existing early dialog or create a new one.
                    let earlyDialog = this.earlyDialogs.get(dialogState.id);
                    if (!earlyDialog) {
                        const transaction = this.transaction;
                        if (!(transaction instanceof InviteClientTransaction)) {
                            throw new Error("Transaction not instance of InviteClientTransaction.");
                        }
                        earlyDialog = new SessionDialog(transaction, this.core, dialogState);
                        this.earlyDialogs.set(earlyDialog.id, earlyDialog);
                    }
                    // Guard against out of order reliable provisional responses.
                    // Note that this is where the rseq tracking is done.
                    if (!earlyDialog.reliableSequenceGuard(message)) {
                        this.logger.warn("1xx INVITE reliable response received out of order or is a retransmission, dropping.");
                        return;
                    }
                    // If the initial offer is in an INVITE, the answer MUST be in a
                    // reliable non-failure message from UAS back to UAC which is
                    // correlated to that INVITE.  For this specification, that is
                    // only the final 2xx response to that INVITE.  That same exact
                    // answer MAY also be placed in any provisional responses sent
                    // prior to the answer.  The UAC MUST treat the first session
                    // description it receives as the answer, and MUST ignore any
                    // session descriptions in subsequent responses to the initial
                    // INVITE.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    if (earlyDialog.signalingState === SignalingState.Initial ||
                        earlyDialog.signalingState === SignalingState.HaveLocalOffer) {
                        earlyDialog.signalingStateTransition(message);
                    }
                    // Pass response to delegate.
                    const session = earlyDialog;
                    if (this.delegate && this.delegate.onProgress) {
                        this.delegate.onProgress({
                            message,
                            session,
                            prack: (options) => {
                                const outgoingPrackRequest = session.prack(undefined, options);
                                return outgoingPrackRequest;
                            }
                        });
                    }
                }
                return;
            case /^2[0-9]{2}$/.test(statusCode):
                // Multiple 2xx responses may arrive at the UAC for a single INVITE
                // request due to a forking proxy.  Each response is distinguished by
                // the tag parameter in the To header field, and each represents a
                // distinct dialog, with a distinct dialog identifier.
                //
                // If the dialog identifier in the 2xx response matches the dialog
                // identifier of an existing dialog, the dialog MUST be transitioned to
                // the "confirmed" state, and the route set for the dialog MUST be
                // recomputed based on the 2xx response using the procedures of Section
                // 12.2.1.2.  Otherwise, a new dialog in the "confirmed" state MUST be
                // constructed using the procedures of Section 12.1.2.
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
                {
                    // Dialogs are created through the generation of non-failure responses
                    // to requests with specific methods.  Within this specification, only
                    // 2xx and 101-199 responses with a To tag, where the request was
                    // INVITE, will establish a dialog.  A dialog established by a non-final
                    // response to a request is in the "early" state and it is called an
                    // early dialog.
                    // https://tools.ietf.org/html/rfc3261#section-12.1
                    // Final without to tag, malformed response.
                    if (!message.toTag) {
                        this.logger.error("2xx INVITE response received without a to tag, dropping.");
                        return;
                    }
                    // When a UAS responds to a request with a response that establishes a
                    // dialog (such as a 2xx to INVITE), the UAS MUST copy all Record-Route
                    // header field values from the request into the response (including the
                    // URIs, URI parameters, and any Record-Route header field parameters,
                    // whether they are known or unknown to the UAS) and MUST maintain the
                    // order of those values.  The UAS MUST add a Contact header field to
                    // the response.
                    // https://tools.ietf.org/html/rfc3261#section-12.1.1
                    // Final without Contact header field, malformed response.
                    const contact = message.parseHeader("contact");
                    if (!contact) {
                        this.logger.error("2xx INVITE response received without a Contact header field, dropping.");
                        return;
                    }
                    // Compute dialog state.
                    const dialogState = Dialog.initialDialogStateForUserAgentClient(this.message, message);
                    // NOTE: Currently our transaction layer is caching the 2xx ACKs and
                    // handling retransmissions of the ACK which is an approach which is
                    // not to spec. In any event, this block is intended to provide a to
                    // spec implementation of ACK retransmissions, but it should not be
                    // hit currently.
                    let dialog = this.confirmedDialogs.get(dialogState.id);
                    if (dialog) {
                        // Once the ACK has been constructed, the procedures of [4] are used to
                        // determine the destination address, port and transport.  However, the
                        // request is passed to the transport layer directly for transmission,
                        // rather than a client transaction.  This is because the UAC core
                        // handles retransmissions of the ACK, not the transaction layer.  The
                        // ACK MUST be passed to the client transport every time a
                        // retransmission of the 2xx final response that triggered the ACK
                        // arrives.
                        // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
                        const outgoingAckRequest = this.confirmedDialogAcks.get(dialogState.id);
                        if (outgoingAckRequest) {
                            const transaction = this.transaction;
                            if (!(transaction instanceof InviteClientTransaction)) {
                                throw new Error("Client transaction not instance of InviteClientTransaction.");
                            }
                            transaction.ackResponse(outgoingAckRequest.message);
                        }
                        else {
                            // If still waiting for an ACK, drop the retransmission of the 2xx final response.
                        }
                        return;
                    }
                    // If the dialog identifier in the 2xx response matches the dialog
                    // identifier of an existing dialog, the dialog MUST be transitioned to
                    // the "confirmed" state, and the route set for the dialog MUST be
                    // recomputed based on the 2xx response using the procedures of Section
                    // 12.2.1.2. Otherwise, a new dialog in the "confirmed" state MUST be
                    // constructed using the procedures of Section 12.1.2.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
                    dialog = this.earlyDialogs.get(dialogState.id);
                    if (dialog) {
                        dialog.confirm();
                        dialog.recomputeRouteSet(message);
                        this.earlyDialogs.delete(dialog.id);
                        this.confirmedDialogs.set(dialog.id, dialog);
                    }
                    else {
                        const transaction = this.transaction;
                        if (!(transaction instanceof InviteClientTransaction)) {
                            throw new Error("Transaction not instance of InviteClientTransaction.");
                        }
                        dialog = new SessionDialog(transaction, this.core, dialogState);
                        this.confirmedDialogs.set(dialog.id, dialog);
                    }
                    // If the initial offer is in an INVITE, the answer MUST be in a
                    // reliable non-failure message from UAS back to UAC which is
                    // correlated to that INVITE.  For this specification, that is
                    // only the final 2xx response to that INVITE.  That same exact
                    // answer MAY also be placed in any provisional responses sent
                    // prior to the answer.  The UAC MUST treat the first session
                    // description it receives as the answer, and MUST ignore any
                    // session descriptions in subsequent responses to the initial
                    // INVITE.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    if (dialog.signalingState === SignalingState.Initial ||
                        dialog.signalingState === SignalingState.HaveLocalOffer) {
                        dialog.signalingStateTransition(message);
                    }
                    // Session Initiated! :)
                    const session = dialog;
                    // The UAC core MUST generate an ACK request for each 2xx received from
                    // the transaction layer.  The header fields of the ACK are constructed
                    // in the same way as for any request sent within a dialog (see Section
                    // 12) with the exception of the CSeq and the header fields related to
                    // authentication.  The sequence number of the CSeq header field MUST be
                    // the same as the INVITE being acknowledged, but the CSeq method MUST
                    // be ACK.  The ACK MUST contain the same credentials as the INVITE.  If
                    // the 2xx contains an offer (based on the rules above), the ACK MUST
                    // carry an answer in its body.  If the offer in the 2xx response is not
                    // acceptable, the UAC core MUST generate a valid answer in the ACK and
                    // then send a BYE immediately.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
                    if (this.delegate && this.delegate.onAccept) {
                        this.delegate.onAccept({
                            message,
                            session,
                            ack: (options) => {
                                const outgoingAckRequest = session.ack(options);
                                this.confirmedDialogAcks.set(session.id, outgoingAckRequest);
                                return outgoingAckRequest;
                            }
                        });
                    }
                    else {
                        const outgoingAckRequest = session.ack();
                        this.confirmedDialogAcks.set(session.id, outgoingAckRequest);
                    }
                }
                return;
            case /^3[0-9]{2}$/.test(statusCode):
                // 12.3 Termination of a Dialog
                //
                // Independent of the method, if a request outside of a dialog generates
                // a non-2xx final response, any early dialogs created through
                // provisional responses to that request are terminated.  The mechanism
                // for terminating confirmed dialogs is method specific.  In this
                // specification, the BYE method terminates a session and the dialog
                // associated with it.  See Section 15 for details.
                // https://tools.ietf.org/html/rfc3261#section-12.3
                // All early dialogs are considered terminated upon reception of the
                // non-2xx final response.
                //
                // After having received the non-2xx final response the UAC core
                // considers the INVITE transaction completed.  The INVITE client
                // transaction handles the generation of ACKs for the response (see
                // Section 17).
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.3
                this.earlyDialogs.forEach((earlyDialog) => earlyDialog.dispose());
                this.earlyDialogs.clear();
                // A 3xx response may contain one or more Contact header field values
                // providing new addresses where the callee might be reachable.
                // Depending on the status code of the 3xx response (see Section 21.3),
                // the UAC MAY choose to try those new addresses.
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.2
                if (this.delegate && this.delegate.onRedirect) {
                    this.delegate.onRedirect({ message });
                }
                return;
            case /^[4-6][0-9]{2}$/.test(statusCode):
                // 12.3 Termination of a Dialog
                //
                // Independent of the method, if a request outside of a dialog generates
                // a non-2xx final response, any early dialogs created through
                // provisional responses to that request are terminated.  The mechanism
                // for terminating confirmed dialogs is method specific.  In this
                // specification, the BYE method terminates a session and the dialog
                // associated with it.  See Section 15 for details.
                // https://tools.ietf.org/html/rfc3261#section-12.3
                // All early dialogs are considered terminated upon reception of the
                // non-2xx final response.
                //
                // After having received the non-2xx final response the UAC core
                // considers the INVITE transaction completed.  The INVITE client
                // transaction handles the generation of ACKs for the response (see
                // Section 17).
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.3
                this.earlyDialogs.forEach((earlyDialog) => earlyDialog.dispose());
                this.earlyDialogs.clear();
                // A single non-2xx final response may be received for the INVITE.  4xx,
                // 5xx and 6xx responses may contain a Contact header field value
                // indicating the location where additional information about the error
                // can be found.  Subsequent final responses (which would only arrive
                // under error conditions) MUST be ignored.
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.3
                if (this.delegate && this.delegate.onReject) {
                    this.delegate.onReject({ message });
                }
                return;
            default:
                throw new Error(`Invalid status code ${statusCode}`);
        }
        throw new Error(`Executing what should be an unreachable code path receiving ${statusCode} response.`);
    }
}
