module.export({PrackUserAgentClient:function(){return PrackUserAgentClient}});var C;module.link("../messages",{C:function(v){C=v}},0);var NonInviteClientTransaction;module.link("../transactions",{NonInviteClientTransaction:function(v){NonInviteClientTransaction=v}},1);var UserAgentClient;module.link("./user-agent-client",{UserAgentClient:function(v){UserAgentClient=v}},2);


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
