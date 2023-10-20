// Note: Please don't add any new methods to this file, since its still in js and we are migrating to ts
// Please add new methods to LivechatTyped.ts
import { Message } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import {
	LivechatVisitors,
	LivechatCustomField,
	LivechatRooms,
	LivechatInquiry,
	Subscriptions,
	Messages,
	LivechatDepartment as LivechatDepartmentRaw,
	Rooms,
	Users,
	ReadReceipts,
} from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import UAParser from 'ua-parser-js';

import { Apps, AppEvents } from '../../../../ee/server/apps';
import { callbacks } from '../../../../lib/callbacks';
import { trim } from '../../../../lib/utils/stringUtils';
import { i18n } from '../../../../server/lib/i18n';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { FileUpload } from '../../../file-upload/server';
import { deleteMessage } from '../../../lib/server/functions/deleteMessage';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';
import { businessHourManager } from '../business-hour';
import { Analytics } from './Analytics';
import { normalizeTransferredByData, parseAgentCustomFields, updateDepartmentAgents } from './Helper';
import { Livechat as LivechatTyped } from './LivechatTyped';
import { RoutingManager } from './RoutingManager';

const logger = new Logger('Livechat');

export const Livechat = {
	Analytics,

	logger,

	async sendMessage({ guest, message, roomInfo, agent }) {
		const { room, newRoom } = await LivechatTyped.getRoom(guest, message, roomInfo, agent);
		if (guest.name) {
			message.alias = guest.name;
		}
		return Object.assign(await sendMessage(guest, message, room), {
			newRoom,
			showConnecting: this.showConnecting(),
		});
	},

	async deleteMessage({ guest, message }) {
		Livechat.logger.debug(`Attempting to delete a message by visitor ${guest._id}`);
		check(message, Match.ObjectIncluding({ _id: String }));

		const msg = await Messages.findOneById(message._id);
		if (!msg || !msg._id) {
			return;
		}

		const deleteAllowed = settings.get('Message_AllowDeleting');
		const editOwn = msg.u && msg.u._id === guest._id;

		if (!deleteAllowed || !editOwn) {
			Livechat.logger.debug('Cannot delete message: not allowed');
			throw new Meteor.Error('error-action-not-allowed', 'Message deleting not allowed', {
				method: 'livechatDeleteMessage',
			});
		}

		await deleteMessage(message, guest);

		return true;
	},

	async saveGuest(guestData, userId) {
		const { _id, name, email, phone, livechatData = {} } = guestData;
		Livechat.logger.debug(`Saving data for visitor ${_id}`);
		const updateData = {};

		if (name) {
			updateData.name = name;
		}
		if (email) {
			updateData.email = email;
		}
		if (phone) {
			updateData.phone = phone;
		}

		const customFields = {};

		if ((!userId || (await hasPermissionAsync(userId, 'edit-livechat-room-customfields'))) && Object.keys(livechatData).length) {
			Livechat.logger.debug(`Saving custom fields for visitor ${_id}`);
			const fields = LivechatCustomField.findByScope('visitor');
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
			updateData.livechatData = customFields;
			Livechat.logger.debug(`About to update ${Object.keys(customFields).length} custom fields for visitor ${_id}`);
		}
		const ret = await LivechatVisitors.saveGuestById(_id, updateData);

		setImmediate(() => {
			Apps.triggerEvent(AppEvents.IPostLivechatGuestSaved, _id);
			callbacks.run('livechat.saveGuest', updateData);
		});

		return ret;
	},

	async setCustomFields({ token, key, value, overwrite } = {}) {
		check(token, String);
		check(key, String);
		check(value, String);
		check(overwrite, Boolean);
		Livechat.logger.debug(`Setting custom fields data for visitor with token ${token}`);

		const customField = await LivechatCustomField.findOneById(key);
		if (!customField) {
			throw new Meteor.Error('invalid-custom-field');
		}

		if (customField.regexp !== undefined && customField.regexp !== '') {
			const regexp = new RegExp(customField.regexp);
			if (!regexp.test(value)) {
				throw new Meteor.Error(i18n.t('error-invalid-custom-field-value', { field: key }));
			}
		}

		let result;
		if (customField.scope === 'room') {
			result = await LivechatRooms.updateDataByToken(token, key, value, overwrite);
		} else {
			result = await LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
		}

		if (result) {
			return result.modifiedCount;
		}

		return 0;
	},

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

	async savePageHistory(token, roomId, pageInfo) {
		Livechat.logger.debug(`Saving page movement history for visitor with token ${token}`);
		if (pageInfo.change !== settings.get('Livechat_history_monitor_type')) {
			return;
		}
		const user = await Users.findOneById('rocket.cat');

		const pageTitle = pageInfo.title;
		const pageUrl = pageInfo.location.href;
		const extraData = {
			navigation: {
				page: pageInfo,
				token,
			},
		};

		if (!roomId) {
			// keep history of unregistered visitors for 1 month
			const keepHistoryMiliseconds = 2592000000;
			extraData.expireAt = new Date().getTime() + keepHistoryMiliseconds;
		}

		if (!settings.get('Livechat_Visitor_navigation_as_a_message')) {
			extraData._hidden = true;
		}

		return Message.saveSystemMessage('livechat_navigation_history', roomId, `${pageTitle} - ${pageUrl}`, user, extraData);
	},

	async saveTransferHistory(room, transferData) {
		Livechat.logger.debug(`Saving transfer history for room ${room._id}`);
		const { departmentId: previousDepartment } = room;
		const { department: nextDepartment, transferredBy, transferredTo, scope, comment } = transferData;

		check(
			transferredBy,
			Match.ObjectIncluding({
				_id: String,
				username: String,
				name: Match.Maybe(String),
				type: String,
			}),
		);

		const { _id, username } = transferredBy;
		const scopeData = scope || (nextDepartment ? 'department' : 'agent');
		Livechat.logger.debug(`Storing new chat transfer of ${room._id} [Transfered by: ${_id} to ${scopeData}]`);

		const transfer = {
			transferData: {
				transferredBy,
				ts: new Date(),
				scope: scopeData,
				comment,
				...(previousDepartment && { previousDepartment }),
				...(nextDepartment && { nextDepartment }),
				...(transferredTo && { transferredTo }),
			},
		};

		const type = 'livechat_transfer_history';
		const transferMessage = {
			t: type,
			rid: room._id,
			ts: new Date(),
			msg: '',
			u: {
				_id,
				username,
			},
			groupable: false,
		};

		Object.assign(transferMessage, transfer);

		await sendMessage(transferredBy, transferMessage, room);
	},

	async returnRoomAsInquiry(rid, departmentId, overrideTransferData = {}) {
		Livechat.logger.debug(`Transfering room ${rid} to ${departmentId ? 'department' : ''} queue`);
		const room = await LivechatRooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:returnRoomAsInquiry',
			});
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', {
				method: 'livechat:returnRoomAsInquiry',
			});
		}

		if (room.onHold) {
			throw new Meteor.Error('error-room-onHold', 'Room On Hold', {
				method: 'livechat:returnRoomAsInquiry',
			});
		}

		if (!room.servedBy) {
			return false;
		}

		const user = await Users.findOneById(room.servedBy._id);
		if (!user || !user._id) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:returnRoomAsInquiry',
			});
		}

		// find inquiry corresponding to room
		const inquiry = await LivechatInquiry.findOne({ rid });
		if (!inquiry) {
			return false;
		}

		const transferredBy = normalizeTransferredByData(user, room);
		Livechat.logger.debug(`Transfering room ${room._id} by user ${transferredBy._id}`);
		const transferData = { roomId: rid, scope: 'queue', departmentId, transferredBy, ...overrideTransferData };
		try {
			await this.saveTransferHistory(room, transferData);
			await RoutingManager.unassignAgent(inquiry, departmentId);
		} catch (e) {
			this.logger.error(e);
			throw new Meteor.Error('error-returning-inquiry', 'Error returning inquiry to the queue', {
				method: 'livechat:returnRoomAsInquiry',
			});
		}

		callbacks.runAsync('livechat:afterReturnRoomAsInquiry', { room });

		return true;
	},

	async getLivechatRoomGuestInfo(room) {
		const visitor = await LivechatVisitors.findOneEnabledById(room.v._id);
		const agent = await Users.findOneById(room.servedBy && room.servedBy._id);

		const ua = new UAParser();
		ua.setUA(visitor.userAgent);

		const postData = {
			_id: room._id,
			label: room.fname || room.label, // using same field for compatibility
			topic: room.topic,
			createdAt: room.ts,
			lastMessageAt: room.lm,
			tags: room.tags,
			customFields: room.livechatData,
			visitor: {
				_id: visitor._id,
				token: visitor.token,
				name: visitor.name,
				username: visitor.username,
				email: null,
				phone: null,
				department: visitor.department,
				ip: visitor.ip,
				os: ua.getOS().name && `${ua.getOS().name} ${ua.getOS().version}`,
				browser: ua.getBrowser().name && `${ua.getBrowser().name} ${ua.getBrowser().version}`,
				customFields: visitor.livechatData,
			},
		};

		if (agent) {
			const customFields = parseAgentCustomFields(agent.customFields);

			postData.agent = {
				_id: agent._id,
				username: agent.username,
				name: agent.name,
				email: null,
				...(customFields && { customFields }),
			};

			if (agent.emails && agent.emails.length > 0) {
				postData.agent.email = agent.emails[0].address;
			}
		}

		if (room.crmData) {
			postData.crmData = room.crmData;
		}

		if (visitor.visitorEmails && visitor.visitorEmails.length > 0) {
			postData.visitor.email = visitor.visitorEmails;
		}
		if (visitor.phone && visitor.phone.length > 0) {
			postData.visitor.phone = visitor.phone;
		}

		return postData;
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

	async afterRemoveAgent(user) {
		await callbacks.run('livechat.afterAgentRemoved', { agent: user });
		return true;
	},

	async removeAgent(username) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:removeAgent',
			});
		}

		const { _id } = user;

		if (await removeUserFromRolesAsync(_id, ['livechat-agent'])) {
			return this.afterRemoveAgent(user);
		}

		return false;
	},

	async removeManager(username) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:removeManager',
			});
		}

		return removeUserFromRolesAsync(user._id, ['livechat-manager']);
	},

	async removeGuest(_id) {
		const guest = await LivechatVisitors.findOneEnabledById(_id, { projection: { _id: 1, token: 1 } });
		if (!guest) {
			throw new Meteor.Error('error-invalid-guest', 'Invalid guest', {
				method: 'livechat:removeGuest',
			});
		}

		await this.cleanGuestHistory(guest);
		return LivechatVisitors.disableById(_id);
	},

	async setUserStatusLivechat(userId, status) {
		const user = await Users.setLivechatStatus(userId, status);
		callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });
		return user;
	},

	async setUserStatusLivechatIf(userId, status, condition, fields) {
		const user = await Users.setLivechatStatusIf(userId, status, condition, fields);
		callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });
		return user;
	},

	async cleanGuestHistory(guest) {
		const { token } = guest;

		// This shouldn't be possible, but just in case
		if (!token) {
			throw new Error('error-invalid-guest');
		}

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		const cursor = LivechatRooms.findByVisitorToken(token, extraQuery);
		for await (const room of cursor) {
			await Promise.all([
				FileUpload.removeFilesByRoomId(room._id),
				Messages.removeByRoomId(room._id),
				ReadReceipts.removeByRoomId(room._id),
			]);
		}

		await Promise.all([
			Subscriptions.removeByVisitorToken(token),
			LivechatRooms.removeByVisitorToken(token),
			LivechatInquiry.removeByVisitorToken(token),
		]);
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

	async requestTranscript({ rid, email, subject, user }) {
		check(rid, String);
		check(email, String);
		check(subject, String);
		check(
			user,
			Match.ObjectIncluding({
				_id: String,
				username: String,
				utcOffset: Number,
				name: Match.Maybe(String),
			}),
		);

		const room = await LivechatRooms.findOneById(rid, { projection: { _id: 1, open: 1, transcriptRequest: 1 } });

		if (!room || !room.open) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		if (room.transcriptRequest) {
			throw new Meteor.Error('error-transcript-already-requested', 'Transcript already requested');
		}

		const { _id, username, name, utcOffset } = user;
		const transcriptRequest = {
			requestedAt: new Date(),
			requestedBy: {
				_id,
				username,
				name,
				utcOffset,
			},
			email,
			subject,
		};

		await LivechatRooms.setEmailTranscriptRequestedByRoomId(rid, transcriptRequest);
		return true;
	},

	async notifyGuestStatusChanged(token, status) {
		await LivechatInquiry.updateVisitorStatus(token, status);
		await LivechatRooms.updateVisitorStatus(token, status);
	},

	async allowAgentChangeServiceStatus(statusLivechat, agentId) {
		if (statusLivechat !== 'available') {
			return true;
		}

		return businessHourManager.allowAgentChangeServiceStatus(agentId);
	},
};
