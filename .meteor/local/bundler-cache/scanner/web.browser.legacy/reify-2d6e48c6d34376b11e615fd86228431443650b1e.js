module.export({ByeUserAgentClient:function(){return ByeUserAgentClient}});var C;module.link("../messages",{C:function(v){C=v}},0);var NonInviteClientTransaction;module.link("../transactions",{NonInviteClientTransaction:function(v){NonInviteClientTransaction=v}},1);var UserAgentClient;module.link("./user-agent-client",{UserAgentClient:function(v){UserAgentClient=v}},2);


/**
 * BYE UAC.
 * @public
 */
class ByeUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.BYE, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
        dialog.dispose();
    }
}
