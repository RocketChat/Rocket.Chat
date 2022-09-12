module.export({InfoUserAgentClient:()=>InfoUserAgentClient});let C;module.link("../messages",{C(v){C=v}},0);let NonInviteClientTransaction;module.link("../transactions",{NonInviteClientTransaction(v){NonInviteClientTransaction=v}},1);let UserAgentClient;module.link("./user-agent-client",{UserAgentClient(v){UserAgentClient=v}},2);


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
