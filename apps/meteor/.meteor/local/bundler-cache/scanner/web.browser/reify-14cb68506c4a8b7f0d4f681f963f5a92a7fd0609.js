module.export({InfoUserAgentClient:()=>InfoUserAgentClient});let C;module.link("../messages/methods/constants.js",{C(v){C=v}},0);let NonInviteClientTransaction;module.link("../transactions/non-invite-client-transaction.js",{NonInviteClientTransaction(v){NonInviteClientTransaction=v}},1);let UserAgentClient;module.link("./user-agent-client.js",{UserAgentClient(v){UserAgentClient=v}},2);


/**
 * INFO UAC.
 * @public
 */
class InfoUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.INFO, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
