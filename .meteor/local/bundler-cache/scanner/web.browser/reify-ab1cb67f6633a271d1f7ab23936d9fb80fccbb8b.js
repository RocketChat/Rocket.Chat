module.export({PrackUserAgentServer:()=>PrackUserAgentServer});let NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction(v){NonInviteServerTransaction=v}},0);let UserAgentServer;module.link("./user-agent-server",{UserAgentServer(v){UserAgentServer=v}},1);

/**
 * PRACK UAS.
 * @public
 */
class PrackUserAgentServer extends UserAgentServer {
    constructor(dialog, message, delegate) {
        super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
        // Update dialog signaling state with offer/answer in body
        dialog.signalingStateTransition(message);
        this.dialog = dialog;
    }
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    accept(options = { statusCode: 200 }) {
        if (options.body) {
            // Update dialog signaling state with offer/answer in body
            this.dialog.signalingStateTransition(options.body);
        }
        return super.accept(options);
    }
}
