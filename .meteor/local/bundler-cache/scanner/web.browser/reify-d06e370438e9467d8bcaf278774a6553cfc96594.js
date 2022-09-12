module.export({MessageUserAgentClient:()=>MessageUserAgentClient});let NonInviteClientTransaction;module.link("../transactions",{NonInviteClientTransaction(v){NonInviteClientTransaction=v}},0);let UserAgentClient;module.link("./user-agent-client",{UserAgentClient(v){UserAgentClient=v}},1);

/**
 * MESSAGE UAC.
 * @public
 */
class MessageUserAgentClient extends UserAgentClient {
    constructor(core, message, delegate) {
        super(NonInviteClientTransaction, core, message, delegate);
    }
}
