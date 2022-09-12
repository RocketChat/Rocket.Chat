module.export({MessageUserAgentServer:function(){return MessageUserAgentServer}});var NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction:function(v){NonInviteServerTransaction=v}},0);var UserAgentServer;module.link("./user-agent-server",{UserAgentServer:function(v){UserAgentServer=v}},1);

/**
 * MESSAGE UAS.
 * @public
 */
class MessageUserAgentServer extends UserAgentServer {
    constructor(core, message, delegate) {
        super(NonInviteServerTransaction, core, message, delegate);
    }
}
