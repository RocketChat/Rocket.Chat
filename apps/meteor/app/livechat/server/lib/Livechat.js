// Note: Please don't add any new methods to this file, since its still in js and we are migrating to ts
// Please add new methods to LivechatTyped.ts
import { Logger } from '@rocket.chat/logger';
import {
	LivechatCustomField,
	LivechatRooms,
	LivechatInquiry,
	Subscriptions,
	LivechatDepartment as LivechatDepartmentRaw,
	Rooms,
	Users,
} from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { Apps, AppEvents } from '../../../../ee/server/apps';
import { callbacks } from '../../../../lib/callbacks';
import { trim } from '../../../../lib/utils/stringUtils';
import { i18n } from '../../../../server/lib/i18n';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import * as Mailer from '../../../mailer/server/api';
import { Analytics } from './Analytics';
import { updateDepartmentAgents } from './Helper';
import { RoutingManager } from './RoutingManager';

const logger = new Logger('Livechat');

export const Livechat = {
	Analytics,

	logger,

	async saveRoomInfo(roomData, guestData, userId) {
		Livechat.logger.debug(`Saving room information on room ${roomData._id}`);
		const { livechatData = {} } = roomData;
		const customFields = {};

		if ((!userId || (await hasPermissionAsync(userId, 'edit-livechat-room-customfields'))) && Object.keys(livechatData).length) {
			Livechat.logger.debug(`Updating custom fields on room ${roomData._id}`);
			const fields = LivechatCustomField.findByScope('room');
			for await (const field of fields) {
				if (!livechatData.hasOwnProperty(field._id)) {
					continue;
				}
				const value = trim(livechatData[field._id]);
				if (value !== '' && field.regexp !== undefined && field.regexp !== '') {
					const regexp = new RegExp(field.regexp);
					if (!regexp.test(value)) {
						throw new Meteor.Error(i18n.t('error-invalid-custom-field-value', { field: field.label }));
					}
				}
				customFields[field._id] = value;
			}
			roomData.livechatData = customFields;
			Livechat.logger.debug(`About to update ${Object.keys(customFields).length} custom fields on room ${roomData._id}`);
		}

		if (!(await LivechatRooms.saveRoomById(roomData))) {
			Livechat.logger.debug(`Failed to save room information on room ${roomData._id}`);
			return false;
		}

		setImmediate(() => {
			Apps.triggerEvent(AppEvents.IPostLivechatRoomSaved, roomData._id);
		});
		callbacks.runAsync('livechat.saveRoom', roomData);

		if (guestData?.name?.trim().length) {
			const { _id: rid } = roomData;
			const { name } = guestData;
			return (
				(await Rooms.setFnameById(rid, name)) &&
				(await LivechatInquiry.setNameByRoomId(rid, name)) &&
				// This one needs to be the last since the agent may not have the subscription
				// when the conversation is in the queue, then the result will be 0(zero)
				Subscriptions.updateDisplayNameByRoomId(rid, name)
			);
		}
	},

	async afterAgentAdded(user) {
		await Users.setOperator(user._id, true);
		await this.setUserStatusLivechat(user._id, user.status !== 'offline' ? 'available' : 'not-available');

		callbacks.runAsync('livechat.onNewAgentCreated', user._id);

		return user;
	},

	async addAgent(username) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:addAgent' });
		}

		if (await addUserRolesAsync(user._id, ['livechat-agent'])) {
			return this.afterAgentAdded(user);
		}

		return false;
	},

	async addManager(username) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:addManager',
			});
		}

		if (await addUserRolesAsync(user._id, ['livechat-manager'])) {
			return user;
		}

		return false;
	},

	async setUserStatusLivechat(userId, status) {
		const user = await Users.setLivechatStatus(userId, status);
		callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });
		return user;
	},

	async saveDepartmentAgents(_id, departmentAgents) {
		check(_id, String);
		check(departmentAgents, {
			upsert: Match.Maybe([
				Match.ObjectIncluding({
					agentId: String,
					username: String,
					count: Match.Maybe(Match.Integer),
					order: Match.Maybe(Match.Integer),
				}),
			]),
			remove: Match.Maybe([
				Match.ObjectIncluding({
					agentId: String,
					username: Match.Maybe(String),
					count: Match.Maybe(Match.Integer),
					order: Match.Maybe(Match.Integer),
				}),
			]),
		});

		const department = await LivechatDepartmentRaw.findOneById(_id);
		if (!department) {
			throw new Meteor.Error('error-department-not-found', 'Department not found', {
				method: 'livechat:saveDepartmentAgents',
			});
		}

		return updateDepartmentAgents(_id, departmentAgents, department.enabled);
	},

	showConnecting() {
		const { showConnecting } = RoutingManager.getConfig();
		return showConnecting;
	},

	async sendEmail(from, to, replyTo, subject, html) {
		return Mailer.send({
			to,
			from,
			replyTo,
			subject,
			html,
		});
	},

	async notifyGuestStatusChanged(token, status) {
		await LivechatInquiry.updateVisitorStatus(token, status);
		await LivechatRooms.updateVisitorStatus(token, status);
	},
};
