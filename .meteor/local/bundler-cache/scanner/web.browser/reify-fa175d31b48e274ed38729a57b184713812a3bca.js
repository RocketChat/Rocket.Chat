module.export({ReSubscribeUserAgentClient:()=>ReSubscribeUserAgentClient});let C;module.link("../messages",{C(v){C=v}},0);let NonInviteClientTransaction;module.link("../transactions",{NonInviteClientTransaction(v){NonInviteClientTransaction=v}},1);let UserAgentClient;module.link("./user-agent-client",{UserAgentClient(v){UserAgentClient=v}},2);


/**
 * Re-SUBSCRIBE UAC.
 * @public
 */
class ReSubscribeUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.SUBSCRIBE, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
        this.dialog = dialog;
    }
    waitNotifyStop() {
        // TODO: Placeholder. Not utilized currently.
        return;
    }
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    receiveResponse(message) {
        if (message.statusCode && message.statusCode >= 200 && message.statusCode < 300) {
            //  The "Expires" header field in a 200-class response to SUBSCRIBE
            //  request indicates the actual duration for which the subscription will
            //  remain active (unless refreshed).  The received value might be
            //  smaller than the value indicated in the SUBSCRIBE request but cannot
            //  be larger; see Section 4.2.1 for details.
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
            const expires = message.getHeader("Expires");
            if (!expires) {
                this.logger.warn("Expires header missing in a 200-class response to SUBSCRIBE");
            }
            else {
                const subscriptionExpiresReceived = Number(expires);
                if (this.dialog.subscriptionExpires > subscriptionExpiresReceived) {
                    this.dialog.subscriptionExpires = subscriptionExpiresReceived;
                }
            }
        }
        if (message.statusCode && message.statusCode >= 400 && message.statusCode < 700) {
            // If a SUBSCRIBE request to refresh a subscription receives a 404, 405,
            // 410, 416, 480-485, 489, 501, or 604 response, the subscriber MUST
            // consider the subscription terminated.  (See [RFC5057] for further
            // details and notes about the effect of error codes on dialogs and
            // usages within dialog, such as subscriptions).  If the subscriber
            // wishes to re-subscribe to the state, he does so by composing an
            // unrelated initial SUBSCRIBE request with a freshly generated Call-ID
            // and a new, unique "From" tag (see Section 4.1.2.1).
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.2
            const errorCodes = [404, 405, 410, 416, 480, 481, 482, 483, 484, 485, 489, 501, 604];
            if (errorCodes.includes(message.statusCode)) {
                this.dialog.terminate();
            }
            // If a SUBSCRIBE request to refresh a subscription fails with any error
            // code other than those listed above, the original subscription is
            // still considered valid for the duration of the most recently known
            // "Expires" value as negotiated by the most recent successful SUBSCRIBE
            // transaction, or as communicated by a NOTIFY request in its
            // "Subscription-State" header field "expires" parameter.
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.2
        }
        super.receiveResponse(message);
    }
}
