module.export({ReSubscribeUserAgentServer:()=>ReSubscribeUserAgentServer});let NonInviteServerTransaction;module.link("../transactions/non-invite-server-transaction.js",{NonInviteServerTransaction(v){NonInviteServerTransaction=v}},0);let UserAgentServer;module.link("./user-agent-server.js",{UserAgentServer(v){UserAgentServer=v}},1);

/**
 * Re-SUBSCRIBE UAS.
 * @public
 */
class ReSubscribeUserAgentServer extends UserAgentServer {
    constructor(dialog, message, delegate) {
        super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
    }
}
