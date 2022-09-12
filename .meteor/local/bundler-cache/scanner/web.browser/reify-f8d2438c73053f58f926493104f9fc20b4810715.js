module.export({MessageUserAgentServer:()=>MessageUserAgentServer});let NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction(v){NonInviteServerTransaction=v}},0);let UserAgentServer;module.link("./user-agent-server",{UserAgentServer(v){UserAgentServer=v}},1);

/**
 * MESSAGE UAS.
 * @public
 */
class MessageUserAgentServer extends UserAgentServer {
    constructor(core, message, delegate) {
        super(NonInviteServerTransaction, core, message, delegate);
    }
}
