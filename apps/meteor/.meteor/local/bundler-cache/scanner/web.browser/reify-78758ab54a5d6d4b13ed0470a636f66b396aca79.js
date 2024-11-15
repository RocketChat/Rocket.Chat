module.export({RegisterUserAgentServer:()=>RegisterUserAgentServer});let NonInviteServerTransaction;module.link("../transactions/non-invite-server-transaction.js",{NonInviteServerTransaction(v){NonInviteServerTransaction=v}},0);let UserAgentServer;module.link("./user-agent-server.js",{UserAgentServer(v){UserAgentServer=v}},1);

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
