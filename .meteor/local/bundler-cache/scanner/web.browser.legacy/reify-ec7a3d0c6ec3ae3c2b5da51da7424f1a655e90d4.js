module.export({NotifyUserAgentClient:function(){return NotifyUserAgentClient}});var C;module.link("../messages",{C:function(v){C=v}},0);var NonInviteClientTransaction;module.link("../transactions",{NonInviteClientTransaction:function(v){NonInviteClientTransaction=v}},1);var UserAgentClient;module.link("./user-agent-client",{UserAgentClient:function(v){UserAgentClient=v}},2);


/**
 * NOTIFY UAS.
 * @public
 */
class NotifyUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.NOTIFY, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
