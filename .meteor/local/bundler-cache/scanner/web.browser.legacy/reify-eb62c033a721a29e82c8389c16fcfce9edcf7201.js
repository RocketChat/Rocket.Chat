module.export({ByeUserAgentServer:function(){return ByeUserAgentServer}});var NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction:function(v){NonInviteServerTransaction=v}},0);var UserAgentServer;module.link("./user-agent-server",{UserAgentServer:function(v){UserAgentServer=v}},1);

/**
 * BYE UAS.
 * @public
 */
class ByeUserAgentServer extends UserAgentServer {
    constructor(dialog, message, delegate) {
        super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
    }
}
