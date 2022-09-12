module.export({RegisterUserAgentServer:function(){return RegisterUserAgentServer}});var NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction:function(v){NonInviteServerTransaction=v}},0);var UserAgentServer;module.link("./user-agent-server",{UserAgentServer:function(v){UserAgentServer=v}},1);

/**
 * REGISTER UAS.
 * @public
 */
class RegisterUserAgentServer extends UserAgentServer {
    constructor(core, message, delegate) {
        super(NonInviteServerTransaction, core, message, delegate);
        this.core = core;
    }
}
