module.export({SubscribeUserAgentServer:function(){return SubscribeUserAgentServer}});var NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction:function(v){NonInviteServerTransaction=v}},0);var UserAgentServer;module.link("./user-agent-server",{UserAgentServer:function(v){UserAgentServer=v}},1);

/**
 * SUBSCRIBE UAS.
 * @public
 */
class SubscribeUserAgentServer extends UserAgentServer {
    constructor(core, message, delegate) {
        super(NonInviteServerTransaction, core, message, delegate);
        this.core = core;
    }
}
