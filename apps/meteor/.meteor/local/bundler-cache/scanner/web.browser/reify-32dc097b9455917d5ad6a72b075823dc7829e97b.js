module.export({ReferUserAgentClient:()=>ReferUserAgentClient});let C;module.link("../messages/methods/constants.js",{C(v){C=v}},0);let NonInviteClientTransaction;module.link("../transactions/non-invite-client-transaction.js",{NonInviteClientTransaction(v){NonInviteClientTransaction=v}},1);let UserAgentClient;module.link("./user-agent-client.js",{UserAgentClient(v){UserAgentClient=v}},2);


/**
 * REFER UAC.
 * @public
 */
class ReferUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.REFER, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
