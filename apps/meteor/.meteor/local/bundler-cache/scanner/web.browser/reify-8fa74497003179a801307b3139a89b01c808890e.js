module.export({ReferUserAgentServer:()=>ReferUserAgentServer});let NonInviteServerTransaction;module.link("../transactions",{NonInviteServerTransaction(v){NonInviteServerTransaction=v}},0);let UserAgentServer;module.link("./user-agent-server",{UserAgentServer(v){UserAgentServer=v}},1);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function instanceOfSessionDialog(object) {
    return object.userAgentCore !== undefined;
}
/**
 * REFER UAS.
 * @public
 */
class ReferUserAgentServer extends UserAgentServer {
    /**
     * REFER UAS constructor.
     * @param dialogOrCore - Dialog for in dialog REFER, UserAgentCore for out of dialog REFER.
     * @param message - Incoming REFER request message.
     */
    constructor(dialogOrCore, message, delegate) {
        const userAgentCore = instanceOfSessionDialog(dialogOrCore) ? dialogOrCore.userAgentCore : dialogOrCore;
        super(NonInviteServerTransaction, userAgentCore, message, delegate);
    }
}
