module.export({ByeUserAgentServer:()=>ByeUserAgentServer});let NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction(v){NonInviteServerTransaction=v}},0);let UserAgentServer;module.link("./user-agent-server",{UserAgentServer(v){UserAgentServer=v}},1);

/**
 * BYE UAS.
 * @public
 */
class ByeUserAgentServer extends UserAgentServer {
    constructor(dialog, message, delegate) {
        super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
    }
}
