module.export({InfoUserAgentServer:function(){return InfoUserAgentServer}});var NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction:function(v){NonInviteServerTransaction=v}},0);var UserAgentServer;module.link("./user-agent-server",{UserAgentServer:function(v){UserAgentServer=v}},1);

/**
 * INFO UAS.
 * @public
 */
class InfoUserAgentServer extends UserAgentServer {
    constructor(dialog, message, delegate) {
        super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
    }
}
