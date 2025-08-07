"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNewCallAgent = void 0;
const BasicAgent_1 = require("./BasicAgent");
const Manager_1 = require("../Manager");
class UserNewCallAgent extends BasicAgent_1.UserBasicAgent {
    async onNewCall(call, otherAgent) {
        console.log('UserNewCallAgent.onNewCall');
        // If we have a contract id, ensure the contract is registered
        if (this.contractId) {
            await Manager_1.agentManager.getOrCreateContract(call._id, this);
        }
        await this.sendNewSignal(call, otherAgent);
    }
    async sendNewSignal(call, otherAgent) {
        console.log('UserNewCallAgent.sendNewSignal');
        const contact = await otherAgent.getContactInfo();
        return this.sendSignal({
            callId: call._id,
            type: 'new',
            service: call.service,
            kind: call.kind,
            role: this.role,
            contact,
            ...(this.role === 'caller' && call.callerRequestedId && { requestedCallId: call.callerRequestedId }),
        });
    }
}
exports.UserNewCallAgent = UserNewCallAgent;
//# sourceMappingURL=NewCallAgent.js.map