module.export({PrackUserAgentClient:()=>PrackUserAgentClient});let C;module.link("../messages/methods/constants.js",{C(v){C=v}},0);let NonInviteClientTransaction;module.link("../transactions/non-invite-client-transaction.js",{NonInviteClientTransaction(v){NonInviteClientTransaction=v}},1);let UserAgentClient;module.link("./user-agent-client.js",{UserAgentClient(v){UserAgentClient=v}},2);


/**
 * PRACK UAC.
 * @public
 */
class PrackUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.PRACK, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
        dialog.signalingStateTransition(message);
    }
}
