module.export({PublishUserAgentClient:()=>PublishUserAgentClient});let NonInviteClientTransaction;module.link("../transactions",{NonInviteClientTransaction(v){NonInviteClientTransaction=v}},0);let UserAgentClient;module.link("./user-agent-client",{UserAgentClient(v){UserAgentClient=v}},1);

/**
 * PUBLISH UAC.
 * @public
 */
class PublishUserAgentClient extends UserAgentClient {
    constructor(core, message, delegate) {
        super(NonInviteClientTransaction, core, message, delegate);
    }
}
