import { VideoConf } from '@rocket.chat/core-services';
import type { IUser, ILivechatVisitor, ILivechatDepartment, UserStatus } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatDepartment, LivechatInquiry, LivechatRooms, Users, LivechatDepartmentAgents, Rooms } from '@rocket.chat/models';
import { removeEmpty } from '@rocket.chat/tools';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { updateMessage } from '../../../lib/server/functions/updateMessage';
import { notifyOnLivechatInquiryChangedByToken } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { businessHourManager } from '../business-hour';
import { updateDepartmentAgents } from './Helper';
import { afterAgentAdded, afterRemoveAgent } from './hooks';

class LivechatClass {
	logger: Logger;

	constructor() {
		this.logger = new Logger('Livechat');
	}

	async online(department?: string, skipNoAgentSetting = false, skipFallbackCheck = false): Promise<boolean> {
		Livechat.logger.debug(`Checking online agents ${department ? `for department ${department}` : ''}`);
		if (!skipNoAgentSetting && settings.get('Livechat_accept_chats_with_no_agents')) {
			Livechat.logger.debug('Can accept without online agents: true');
			return true;
		}

		if (settings.get('Livechat_assign_new_conversation_to_bot')) {
			Livechat.logger.debug(`Fetching online bot agents for department ${department}`);
			const botAgents = await Livechat.getBotAgents(department);
			if (botAgents) {
				const onlineBots = await Livechat.countBotAgents(department);
				this.logger.debug(`Found ${onlineBots} online`);
				if (onlineBots > 0) {
					return true;
				}
			}
		}

		const agentsOnline = await this.checkOnlineAgents(department, undefined, skipFallbackCheck);
		Livechat.logger.debug(`Are online agents ${department ? `for department ${department}` : ''}?: ${agentsOnline}`);
		return agentsOnline;
	}

	async checkOnlineAgents(department?: string, agent?: { agentId: string }, skipFallbackCheck = false): Promise<boolean> {
		if (agent?.agentId) {
			return Users.checkOnlineAgents(agent.agentId, settings.get<boolean>('Livechat_enabled_when_agent_idle'));
		}

		if (department) {
			const onlineForDep = await LivechatDepartmentAgents.checkOnlineForDepartment(department);
			if (onlineForDep || skipFallbackCheck) {
				return onlineForDep;
			}

			const dep = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'fallbackForwardDepartment'>>(department, {
				projection: { fallbackForwardDepartment: 1 },
			});
			if (!dep?.fallbackForwardDepartment) {
				return onlineForDep;
			}

			return this.checkOnlineAgents(dep?.fallbackForwardDepartment);
		}

		return Users.checkOnlineAgents(undefined, settings.get<boolean>('Livechat_enabled_when_agent_idle'));
	}

	private async getBotAgents(department?: string) {
		if (department) {
			return LivechatDepartmentAgents.getBotsForDepartment(department);
		}

		return Users.findBotAgents();
	}

	private async countBotAgents(department?: string) {
		if (department) {
			return LivechatDepartmentAgents.countBotsForDepartment(department);
		}

		return Users.countBotAgents();
	}

	async saveAgentInfo(_id: string, agentData: any, agentDepartments: string[]) {
		check(_id, String);
		check(agentData, Object);
		check(agentDepartments, [String]);

		const user = await Users.findOneById(_id);
		if (!user || !(await hasRoleAsync(_id, 'livechat-agent'))) {
			throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent');
		}

		await Users.setLivechatData(_id, removeEmpty(agentData));

		const currentDepartmentsForAgent = await LivechatDepartmentAgents.findByAgentId(_id).toArray();

		const toRemoveIds = currentDepartmentsForAgent
			.filter((dept) => !agentDepartments.includes(dept.departmentId))
			.map((dept) => dept.departmentId);
		const toAddIds = agentDepartments.filter((d) => !currentDepartmentsForAgent.some((c) => c.departmentId === d));

		await Promise.all(
			await LivechatDepartment.findInIds([...toRemoveIds, ...toAddIds], {
				projection: {
					_id: 1,
					enabled: 1,
				},
			})
				.map((dep) => {
					return updateDepartmentAgents(
						dep._id,
						{
							...(toRemoveIds.includes(dep._id) ? { remove: [{ agentId: _id }] } : { upsert: [{ agentId: _id, count: 0, order: 0 }] }),
						},
						dep.enabled,
					);
				})
				.toArray(),
		);

		return true;
	}

	async updateCallStatus(callId: string, rid: string, status: 'ended' | 'declined', user: IUser | ILivechatVisitor) {
		await Rooms.setCallStatus(rid, status);
		if (status === 'ended' || status === 'declined') {
			if (await VideoConf.declineLivechatCall(callId)) {
				return;
			}

			return updateMessage({ _id: callId, msg: status, actionLinks: [], webRtcCallEndTs: new Date(), rid }, user as unknown as IUser);
		}
	}

	async removeAgent(username: string) {
		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Error('error-invalid-user');
		}

		const { _id } = user;

		if (await removeUserFromRolesAsync(_id, ['livechat-agent'])) {
			return afterRemoveAgent(user);
		}

		return false;
	}

	async removeManager(username: string) {
		// TODO: we already validated user exists at this point, remove this check
		const user = await Users.findOneByUsername(username, { projection: { _id: 1 } });

		if (!user) {
			throw new Error('error-invalid-user');
		}

		return removeUserFromRolesAsync(user._id, ['livechat-manager']);
	}

	async allowAgentChangeServiceStatus(statusLivechat: ILivechatAgentStatus, agentId: string) {
		if (statusLivechat !== ILivechatAgentStatus.AVAILABLE) {
			return true;
		}

		return businessHourManager.allowAgentChangeServiceStatus(agentId);
	}

	async notifyGuestStatusChanged(token: string, status: UserStatus) {
		await LivechatRooms.updateVisitorStatus(token, status);

		const inquiryVisitorStatus = await LivechatInquiry.updateVisitorStatus(token, status);

		if (inquiryVisitorStatus.modifiedCount) {
			void notifyOnLivechatInquiryChangedByToken(token, 'updated', { v: { status } });
		}
	}

	async addAgent(username: string) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user');
		}

		if (await addUserRolesAsync(user._id, ['livechat-agent'])) {
			return afterAgentAdded(user);
		}

		return false;
	}

	async addManager(username: string) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user');
		}

		if (await addUserRolesAsync(user._id, ['livechat-manager'])) {
			return user;
		}

		return false;
	}
}

export const Livechat = new LivechatClass();
