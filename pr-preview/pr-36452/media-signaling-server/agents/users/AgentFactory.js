"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAgentFactory = void 0;
const models_1 = require("@rocket.chat/models");
const Manager_1 = require("../Manager");
const Agent_1 = require("./Agent");
const NewCallAgent_1 = require("./NewCallAgent");
// Agent that handles all 'user' actors
class UserAgentFactory {
    static async getAgentFactoryForUser(userId, contractId) {
        const user = await models_1.Users.findOneActiveById(userId, {
            projection: { username: 1, name: 1, freeSwitchExtension: 1 },
        });
        if (!user?.username) {
            console.log('invalid user or no username');
            return null;
        }
        const userData = user;
        return {
            getNewAgent(role) {
                return new NewCallAgent_1.UserNewCallAgent(userData, { role, contractId });
            },
            getCallAgent(call) {
                const { _id: callId } = call;
                if (!contractId) {
                    console.log('no contractId');
                    return null;
                }
                const role = Manager_1.agentManager.getRoleForCallActor(call, { type: 'user', id: userId });
                if (!role) {
                    console.log('no role');
                    return null;
                }
                const { [role]: callActor } = call;
                const contractSigned = Boolean(callActor.contractId);
                // If the role is already signed with a different contract, do not create the agent
                if (contractSigned && callActor.contractId !== contractId) {
                    console.log('signed by another contract');
                    return null;
                }
                return new Agent_1.UserMediaCallAgent(userData, { role, callId, contractId, contractSigned });
            },
        };
    }
    static async getAgentFactoryForActor(actor) {
        if (actor.type !== 'user') {
            return null;
        }
        return this.getAgentFactoryForUser(actor.id, actor.contractId);
    }
}
exports.UserAgentFactory = UserAgentFactory;
//# sourceMappingURL=AgentFactory.js.map