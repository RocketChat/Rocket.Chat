module.export({NotifyUserAgentServer:()=>NotifyUserAgentServer});let NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction(v){NonInviteServerTransaction=v}},0);let UserAgentServer;module.link("./user-agent-server",{UserAgentServer(v){UserAgentServer=v}},1);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function instanceOfDialog(object) {
    return object.userAgentCore !== undefined;
}
/**
 * NOTIFY UAS.
 * @public
 */
class NotifyUserAgentServer extends UserAgentServer {
    /**
     * NOTIFY UAS constructor.
     * @param dialogOrCore - Dialog for in dialog NOTIFY, UserAgentCore for out of dialog NOTIFY (deprecated).
     * @param message - Incoming NOTIFY request message.
     */
    constructor(dialogOrCore, message, delegate) {
        const userAgentCore = instanceOfDialog(dialogOrCore) ? dialogOrCore.userAgentCore : dialogOrCore;
        super(NonInviteServerTransaction, userAgentCore, message, delegate);
    }
}
