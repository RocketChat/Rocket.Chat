"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAgentFactory = void 0;
const models_1 = require("@rocket.chat/models");
const Manager_1 = require("../Manager");
const Agent_1 = require("./Agent");
const NewCallAgent_1 = require("./NewCallAgent");
const logger_1 = require("../../logger");
// Agent that handles all 'user' actors
class UserAgentFactory {
    static async getAgentFactoryForUser(userId, contractId) {
        const user = await models_1.Users.findOneActiveById(userId, {
            projection: { username: 1, name: 1, freeSwitchExtension: 1 },
        });
        if (!user?.username) {
            logger_1.logger.debug({ msg: 'invalid user or no username', method: 'UserAgentFactory.getAgentFactoryForUser', userId, contractId });
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
                    logger_1.logger.debug({ msg: 'no contractId', method: 'UserAgentFactory.getCallAgent', userId, contractId, callId });
                    return null;
                }
                const role = Manager_1.agentManager.getRoleForCallActor(call, { type: 'user', id: userId });
                if (!role) {
                    logger_1.logger.debug({ msg: 'no role', method: 'UserAgentFactory.getCallAgent', userId, contractId, callId });
                    return null;
                }
                const { [role]: callActor } = call;
                let contractState = 'proposed';
                if (callActor.contractId) {
                    contractState = callActor.contractId === contractId ? 'signed' : 'ignored';
                }
                // If the role is already signed with a different contract, do not create the agent
                if (contractState === 'ignored') {
                    logger_1.logger.debug({
                        msg: 'signed by another contract',
                        method: 'UserAgentFactory.getAgentFactoryForUser',
                        userId,
                        contractId,
                        callActor,
                    });
                    return null;
                }
                return new Agent_1.UserMediaCallAgent(userData, { role, callId, contractId, contractState });
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