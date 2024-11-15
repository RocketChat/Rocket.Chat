module.export({InfoUserAgentClient:function(){return InfoUserAgentClient}});var C;module.link("../messages",{C:function(v){C=v}},0);var NonInviteClientTransaction;module.link("../transactions",{NonInviteClientTransaction:function(v){NonInviteClientTransaction=v}},1);var UserAgentClient;module.link("./user-agent-client",{UserAgentClient:function(v){UserAgentClient=v}},2);


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
