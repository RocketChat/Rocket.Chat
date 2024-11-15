module.export({InfoUserAgentServer:()=>InfoUserAgentServer});let NonInviteServerTransaction;module.link("../transactions/non-invite-server-transaction.js",{NonInviteServerTransaction(v){NonInviteServerTransaction=v}},0);let UserAgentServer;module.link("./user-agent-server.js",{UserAgentServer(v){UserAgentServer=v}},1);

/**
 * INFO UAS.
 * @public
 */
class InfoUserAgentServer extends UserAgentServer {
    constructor(dialog, message, delegate) {
        super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
    }
}
