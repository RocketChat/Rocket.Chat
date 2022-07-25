import dns from 'dns';

import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { HTTP } from 'meteor/http';
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment-timezone';
import UAParser from 'ua-parser-js';
import { Users as UsersRaw, LivechatVisitors } from '@rocket.chat/models';

import { QueueManager } from './QueueManager';
import { RoutingManager } from './RoutingManager';
import { Analytics } from './Analytics';
import { settings } from '../../../settings/server';
import { getTimezone } from '../../../utils/server/lib/getTimezone';
import { callbacks } from '../../../../lib/callbacks';
import {
	Users,
	LivechatRooms,
	Messages,
	Subscriptions,
	Settings,
	Rooms,
	LivechatDepartmentAgents,
	LivechatDepartment,
	LivechatCustomField,
	LivechatInquiry,
} from '../../../models/server';
import { Logger } from '../../../logger/server';
import { hasPermission, hasRole, canAccessRoom, roomAccessAttributes } from '../../../authorization/server';
import * as Mailer from '../../../mailer';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { updateMessage } from '../../../lib/server/functions/updateMessage';
import { deleteMessage } from '../../../lib/server/functions/deleteMessage';
import { FileUpload } from '../../../file-upload/server';
import { normalizeTransferredByData, parseAgentCustomFields, updateDepartmentAgents, validateEmail } from './Helper';
import { Apps, AppEvents } from '../../../apps/server';
import { businessHourManager } from '../business-hour';
import notifications from '../../../notifications/server/lib/Notifications';
import { addUserRoles } from '../../../../server/lib/roles/addUserRoles';
import { removeUserFromRoles } from '../../../../server/lib/roles/removeUserFromRoles';
import { VideoConf } from '../../../../server/sdk';

const logger = new Logger('Livechat');

const dnsResolveMx = Meteor.wrapAsync(dns.resolveMx);

export const Livechat = {
	Analytics,
	historyMonitorType: 'url',

	logger,
	webhookLogger: logger.section('Webhook'),

	findGuest(token) {
		return LivechatVisitors.getVisitorByToken(token, {
			fields: {
				name: 1,
				username: 1,
				token: 1,
				visitorEmails: 1,
				department: 1,
			},
		});
	},

	online(department, skipNoAgentSetting = false, skipFallbackCheck = false) {
		Livechat.logger.debug(`Checking online agents ${department ? `for department ${department}` : ''}`);
		if (!skipNoAgentSetting && settings.get('Livechat_accept_chats_with_no_agents')) {
			Livechat.logger.debug('Can accept without online agents: true');
			return true;
		}

		if (settings.get('Livechat_assign_new_conversation_to_bot')) {
			Livechat.logger.debug(`Fetching online bot agents for department ${department}`);
			const botAgents = Livechat.getBotAgents(department);
			const onlineBots = botAgents.count();
			Livechat.logger.debug(`Found ${onlineBots} online`);
			if (onlineBots > 0) {
				return true;
			}
		}

		const agentsOnline = Livechat.checkOnlineAgents(department, {}, skipFallbackCheck);
		Livechat.logger.debug(`Are online agents ${department ? `for department ${department}` : ''}?: ${agentsOnline}`);
		return agentsOnline;
	},

	getNextAgent(department) {
		return RoutingManager.getNextAgent(department);
	},

	getAgents(department) {
		if (department) {
			// TODO: This and all others should get the user's info as well
			return LivechatDepartmentAgents.findByDepartmentId(department);
		}
		return Users.findAgents();
	},

	getOnlineAgents(department, agent) {
		if (agent?.agentId) {
			return Users.findOnlineAgents(agent.agentId);
		}

		if (department) {
			return LivechatDepartmentAgents.getOnlineForDepartment(department);
		}
		return Users.findOnlineAgents();
	},

	checkOnlineAgents(department, agent, skipFallbackCheck = false) {
		if (agent?.agentId) {
			return Users.checkOnlineAgents(agent.agentId);
		}

		if (department) {
			const onlineForDep = LivechatDepartmentAgents.checkOnlineForDepartment(department);
			if (onlineForDep || skipFallbackCheck) {
				return onlineForDep;
			}

			const dep = LivechatDepartment.findOneById(department);
			if (!dep?.fallbackForwardDepartment) {
				return onlineForDep;
			}

			return this.checkOnlineAgents(dep?.fallbackForwardDepartment);
		}

		return Users.checkOnlineAgents();
	},

	getBotAgents(department) {
		if (department) {
			return LivechatDepartmentAgents.getBotsForDepartment(department);
		}

		return Users.findBotAgents();
	},

	getRequiredDepartment(onlineRequired = true) {
		const departments = LivechatDepartment.findEnabledWithAgents();

		return departments.fetch().find((dept) => {
			if (!dept.showOnRegistration) {
				return false;
			}
			if (!onlineRequired) {
				return true;
			}
			const onlineAgents = LivechatDepartmentAgents.getOnlineForDepartment(dept._id);
			return onlineAgents && onlineAgents.count() > 0;
		});
	},

	async getRoom(guest, message, roomInfo, agent, extraData) {
		if (!this.enabled()) {
			throw new Meteor.Error('error-omnichannel-is-disabled');
		}
		Livechat.logger.debug(`Attempting to find or create a room for visitor ${guest._id}`);
		let room = LivechatRooms.findOneById(message.rid);
		let newRoom = false;

		if (room && !room.open) {
			Livechat.logger.debug(`Last room for visitor ${guest._id} closed. Creating new one`);
			message.rid = Random.id();
			room = null;
		}

		if (guest.department && !LivechatDepartment.findOneById(guest.department)) {
			await LivechatVisitors.removeDepartmentById(guest._id);
			guest = await LivechatVisitors.findOneById(guest._id);
		}

		if (room == null) {
			const defaultAgent = callbacks.run('livechat.checkDefaultAgentOnNewRoom', agent, guest);
			// if no department selected verify if there is at least one active and pick the first
			if (!defaultAgent && !guest.department) {
				const department = this.getRequiredDepartment();
				Livechat.logger.debug(`No department or default agent selected for ${guest._id}`);

				if (department) {
					Livechat.logger.debug(`Assigning ${guest._id} to department ${department._id}`);
					guest.department = department._id;
				}
			}

			// delegate room creation to QueueManager
			Livechat.logger.debug(`Calling QueueManager to request a room for visitor ${guest._id}`);
			room = await QueueManager.requestRoom({
				guest,
				message,
				roomInfo,
				agent: defaultAgent,
				extraData,
			});
			newRoom = true;

			Livechat.logger.debug(`Room obtained for visitor ${guest._id} -> ${room._id}`);
		}

		if (!room || room.v.token !== guest.token) {
			Livechat.logger.debug(`Visitor ${guest._id} trying to access another visitor's room`);
			throw new Meteor.Error('cannot-access-room');
		}

		if (newRoom) {
			Messages.setRoomIdByToken(guest.token, room._id);
		}

		return { room, newRoom };
	},

	async sendMessage({ guest, message, roomInfo, agent }) {
		const { room, newRoom } = await this.getRoom(guest, message, roomInfo, agent);
		if (guest.name) {
			message.alias = guest.name;
		}
		return _.extend(sendMessage(guest, message, room), {
			newRoom,
			showConnecting: this.showConnecting(),
		});
	},

	updateMessage({ guest, message }) {
		check(message, Match.ObjectIncluding({ _id: String }));

		const originalMessage = Messages.findOneById(message._id);
		if (!originalMessage || !originalMessage._id) {
			return;
		}

		const editAllowed = settings.get('Message_AllowEditing');
		const editOwn = originalMessage.u && originalMessage.u._id === guest._id;

		if (!editAllowed || !editOwn) {
			throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', {
				method: 'livechatUpdateMessage',
			});
		}

		updateMessage(message, guest);

		return true;
	},

	async deleteMessage({ guest, message }) {
		Livechat.logger.debug(`Attempting to delete a message by visitor ${guest._id}`);
		check(message, Match.ObjectIncluding({ _id: String }));

		const msg = Messages.findOneById(message._id);
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

	async registerGuest({ id, token, name, email, department, phone, username, connectionData, status = 'online' } = {}) {
		check(token, String);
		check(id, Match.Maybe(String));

		Livechat.logger.debug(`New incoming conversation: id: ${id} | token: ${token}`);

		let userId;
		const updateUser = {
			$set: {
				token,
				status,
				...(phone?.number ? { phone: [{ phoneNumber: phone.number }] } : {}),
				...(name ? { name } : {}),
			},
		};

		if (email) {
			email = email.trim().toLowerCase();
			validateEmail(email);
			updateUser.$set.visitorEmails = [{ address: email }];
		}

		if (department) {
			Livechat.logger.debug(`Attempt to find a department with id/name ${department}`);
			const dep = LivechatDepartment.findOneByIdOrName(department);
			if (!dep) {
				Livechat.logger.debug('Invalid department provided');
				throw new Meteor.Error('error-invalid-department', 'The provided department is invalid', {
					method: 'registerGuest',
				});
			}
			Livechat.logger.debug(`Assigning visitor ${token} to department ${dep._id}`);
			updateUser.$set.department = dep._id;
		}

		const user = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });
		let existingUser = null;

		if (user) {
			Livechat.logger.debug('Found matching user by token');
			userId = user._id;
		} else if (phone?.number && (existingUser = await LivechatVisitors.findOneVisitorByPhone(phone.number))) {
			Livechat.logger.debug('Found matching user by phone number');
			userId = existingUser._id;
			// Don't change token when matching by phone number, use current visitor token
			updateUser.$set.token = existingUser.token;
		} else if (email && (existingUser = await LivechatVisitors.findOneGuestByEmailAddress(email))) {
			Livechat.logger.debug('Found matching user by email');
			userId = existingUser._id;
		} else {
			Livechat.logger.debug(`No matches found. Attempting to create new user with token ${token}`);
			if (!username) {
				username = await LivechatVisitors.getNextVisitorUsername();
			}

			const userData = {
				username,
				status,
				ts: new Date(),
				...(id && { _id: id }),
			};

			if (settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations')) {
				Livechat.logger.debug(`Saving connection data for visitor ${token}`);
				const connection = this.connection || connectionData;
				if (connection && connection.httpHeaders) {
					userData.userAgent = connection.httpHeaders['user-agent'];
					userData.ip = connection.httpHeaders['x-real-ip'] || connection.httpHeaders['x-forwarded-for'] || connection.clientAddress;
					userData.host = connection.httpHeaders.host;
				}
			}

			userId = (await LivechatVisitors.insertOne(userData)).insertedId;
		}

		await LivechatVisitors.updateById(userId, updateUser);

		return userId;
	},

	async setDepartmentForGuest({ token, department } = {}) {
		check(token, String);
		check(department, String);

		Livechat.logger.debug(`Switching departments for user with token ${token} (to ${department})`);

		const updateUser = {
			$set: {
				department,
			},
		};

		const dep = LivechatDepartment.findOneById(department);
		if (!dep) {
			throw new Meteor.Error('invalid-department', 'Provided department does not exists', {
				method: 'setDepartmentForGuest',
			});
		}

		const user = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });
		if (user) {
			return LivechatVisitors.updateById(user._id, updateUser);
		}
		return false;
	},

	async saveGuest({ _id, name, email, phone, livechatData = {} }, userId) {
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
		const fields = LivechatCustomField.find({ scope: 'visitor' });

		if (!userId || hasPermission(userId, 'edit-livechat-room-customfields')) {
			fields.forEach((field) => {
				if (!livechatData.hasOwnProperty(field._id)) {
					return;
				}
				const value = s.trim(livechatData[field._id]);
				if (value !== '' && field.regexp !== undefined && field.regexp !== '') {
					const regexp = new RegExp(field.regexp);
					if (!regexp.test(value)) {
						throw new Meteor.Error(TAPi18n.__('error-invalid-custom-field-value', { field: field.label }));
					}
				}
				customFields[field._id] = value;
			});
			updateData.livechatData = customFields;
		}
		const ret = await LivechatVisitors.saveGuestById(_id, updateData);

		Meteor.defer(() => {
			Apps.triggerEvent(AppEvents.IPostLivechatGuestSaved, _id);
			callbacks.run('livechat.saveGuest', updateData);
		});

		return ret;
	},

	closeRoom({ user, visitor, room, comment, options = {} }) {
		Livechat.logger.debug(`Attempting to close room ${room._id}`);
		if (!room || room.t !== 'l' || !room.open) {
			return false;
		}

		const params = callbacks.run('livechat.beforeCloseRoom', { room, options });
		const { extraData } = params;

		const now = new Date();
		const { _id: rid, servedBy, transcriptRequest } = room;
		const serviceTimeDuration = servedBy && (now.getTime() - servedBy.ts) / 1000;

		const closeData = {
			closedAt: now,
			chatDuration: (now.getTime() - room.ts) / 1000,
			...(serviceTimeDuration && { serviceTimeDuration }),
			...extraData,
		};
		Livechat.logger.debug(`Room ${room._id} was closed at ${closeData.closedAt} (duration ${closeData.chatDuration})`);

		if (user) {
			Livechat.logger.debug(`Closing by user ${user._id}`);
			closeData.closer = 'user';
			closeData.closedBy = {
				_id: user._id,
				username: user.username,
			};
		} else if (visitor) {
			Livechat.logger.debug(`Closing by visitor ${visitor._id}`);
			closeData.closer = 'visitor';
			closeData.closedBy = {
				_id: visitor._id,
				username: visitor.username,
			};
		}

		LivechatRooms.closeByRoomId(rid, closeData);
		LivechatInquiry.removeByRoomId(rid);
		Subscriptions.removeByRoomId(rid);

		const message = {
			t: 'livechat-close',
			msg: comment,
			groupable: false,
			transcriptRequested: !!transcriptRequest,
		};

		// Retreive the closed room
		room = LivechatRooms.findOneByIdOrName(rid);

		Livechat.logger.debug(`Sending closing message to room ${room._id}`);
		sendMessage(user || visitor, message, room);

		Messages.createCommandWithRoomIdAndUser('promptTranscript', rid, closeData.closedBy);

		Meteor.defer(() => {
			/**
			 * @deprecated the `AppEvents.ILivechatRoomClosedHandler` event will be removed
			 * in the next major version of the Apps-Engine
			 */
			Apps.getBridges().getListenerBridge().livechatEvent(AppEvents.ILivechatRoomClosedHandler, room);
			Apps.getBridges().getListenerBridge().livechatEvent(AppEvents.IPostLivechatRoomClosed, room);
		});
		callbacks.runAsync('livechat.closeRoom', room);

		return true;
	},

	removeRoom(rid) {
		Livechat.logger.debug(`Deleting room ${rid}`);
		check(rid, String);
		const room = LivechatRooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:removeRoom',
			});
		}

		Messages.removeByRoomId(rid);
		Subscriptions.removeByRoomId(rid);
		LivechatInquiry.removeByRoomId(rid);
		return LivechatRooms.removeById(rid);
	},

	async setCustomFields({ token, key, value, overwrite } = {}) {
		check(token, String);
		check(key, String);
		check(value, String);
		check(overwrite, Boolean);
		Livechat.logger.debug(`Setting custom fields data for visitor with token ${token}`);

		const customField = LivechatCustomField.findOneById(key);
		if (!customField) {
			throw new Meteor.Error('invalid-custom-field');
		}

		if (customField.regexp !== undefined && customField.regexp !== '') {
			const regexp = new RegExp(customField.regexp);
			if (!regexp.test(value)) {
				throw new Meteor.Error(TAPi18n.__('error-invalid-custom-field-value', { field: key }));
			}
		}

		if (customField.scope === 'room') {
			return LivechatRooms.updateDataByToken(token, key, value, overwrite);
		}
		return LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
	},

	enabled() {
		return settings.get('Livechat_enabled');
	},

	getInitSettings() {
		const rcSettings = {};

		Settings.findNotHiddenPublic([
			'Livechat_title',
			'Livechat_title_color',
			'Livechat_enable_message_character_limit',
			'Livechat_message_character_limit',
			'Message_MaxAllowedSize',
			'Livechat_enabled',
			'Livechat_registration_form',
			'Livechat_allow_switching_departments',
			'Livechat_offline_title',
			'Livechat_offline_title_color',
			'Livechat_offline_message',
			'Livechat_offline_success_message',
			'Livechat_offline_form_unavailable',
			'Livechat_display_offline_form',
			'Omnichannel_call_provider',
			'Language',
			'Livechat_enable_transcript',
			'Livechat_transcript_message',
			'Livechat_fileupload_enabled',
			'FileUpload_Enabled',
			'Livechat_conversation_finished_message',
			'Livechat_conversation_finished_text',
			'Livechat_name_field_registration_form',
			'Livechat_email_field_registration_form',
			'Livechat_registration_form_message',
			'Livechat_force_accept_data_processing_consent',
			'Livechat_data_processing_consent_text',
			'Livechat_show_agent_info',
			'Livechat_clear_local_storage_when_chat_ended',
		]).forEach((setting) => {
			rcSettings[setting._id] = setting.value;
		});

		rcSettings.Livechat_history_monitor_type = settings.get('Livechat_history_monitor_type');

		rcSettings.Livechat_Show_Connecting = this.showConnecting();

		return rcSettings;
	},

	saveRoomInfo(roomData, guestData, userId) {
		Livechat.logger.debug(`Saving room information on room ${roomData._id}`);
		const { livechatData = {} } = roomData;
		const customFields = {};

		if (!userId || hasPermission(userId, 'edit-livechat-room-customfields')) {
			const fields = LivechatCustomField.find({ scope: 'room' });
			fields.forEach((field) => {
				if (!livechatData.hasOwnProperty(field._id)) {
					return;
				}
				const value = s.trim(livechatData[field._id]);
				if (value !== '' && field.regexp !== undefined && field.regexp !== '') {
					const regexp = new RegExp(field.regexp);
					if (!regexp.test(value)) {
						throw new Meteor.Error(TAPi18n.__('error-invalid-custom-field-value', { field: field.label }));
					}
				}
				customFields[field._id] = value;
			});
			roomData.livechatData = customFields;
		}

		if (!LivechatRooms.saveRoomById(roomData)) {
			return false;
		}

		Meteor.defer(() => {
			Apps.triggerEvent(AppEvents.IPostLivechatRoomSaved, roomData._id);
		});
		callbacks.runAsync('livechat.saveRoom', roomData);

		if (!_.isEmpty(guestData.name)) {
			const { _id: rid } = roomData;
			const { name } = guestData;
			return (
				Rooms.setFnameById(rid, name) &&
				LivechatInquiry.setNameByRoomId(rid, name) &&
				// This one needs to be the last since the agent may not have the subscription
				// when the conversation is in the queue, then the result will be 0(zero)
				Subscriptions.updateDisplayNameByRoomId(rid, name)
			);
		}
	},

	closeOpenChats(userId, comment) {
		Livechat.logger.debug(`Closing open chats for user ${userId}`);
		const user = Users.findOneById(userId);
		LivechatRooms.findOpenByAgent(userId).forEach((room) => {
			this.closeRoom({ user, room, comment });
		});
	},

	forwardOpenChats(userId) {
		Livechat.logger.debug(`Transferring open chats for user ${userId}`);
		LivechatRooms.findOpenByAgent(userId).forEach((room) => {
			// TODO: refactor to use normal await
			const guest = Promise.await(LivechatVisitors.findOneById(room.v._id));
			const user = Users.findOneById(userId);
			const { _id, username, name } = user;
			const transferredBy = normalizeTransferredByData({ _id, username, name }, room);
			Promise.await(
				this.transfer(room, guest, {
					roomId: room._id,
					transferredBy,
					departmentId: guest.department,
				}),
			);
		});
	},

	savePageHistory(token, roomId, pageInfo) {
		Livechat.logger.debug(`Saving page movement history for visitor with token ${token}`);
		if (pageInfo.change !== Livechat.historyMonitorType) {
			return;
		}
		const user = Users.findOneById('rocket.cat');

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

		return Messages.createNavigationHistoryWithRoomIdMessageAndUser(roomId, `${pageTitle} - ${pageUrl}`, user, extraData);
	},

	saveTransferHistory(room, transferData) {
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

		return Messages.createTransferHistoryWithRoomIdMessageAndUser(room._id, '', { _id, username }, transfer);
	},

	async transfer(room, guest, transferData) {
		Livechat.logger.debug(`Transfering room ${room._id} [Transfered by: ${transferData?.transferredBy?._id}]`);
		if (room.onHold) {
			Livechat.logger.debug('Cannot transfer. Room is on hold');
			throw new Meteor.Error('error-room-onHold', 'Room On Hold', { method: 'livechat:transfer' });
		}

		if (transferData.departmentId) {
			transferData.department = LivechatDepartment.findOneById(transferData.departmentId, {
				fields: { name: 1 },
			});
			Livechat.logger.debug(`Transfering room ${room._id} to department ${transferData.department?._id}`);
		}

		return RoutingManager.transferRoom(room, guest, transferData);
	},

	returnRoomAsInquiry(rid, departmentId) {
		Livechat.logger.debug(`Transfering room ${rid} to ${departmentId ? 'department' : ''} queue`);
		const room = LivechatRooms.findOneById(rid);
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

		const user = Users.findOne(room.servedBy._id);
		if (!user || !user._id) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:returnRoomAsInquiry',
			});
		}

		// find inquiry corresponding to room
		const inquiry = LivechatInquiry.findOne({ rid });
		if (!inquiry) {
			return false;
		}

		const transferredBy = normalizeTransferredByData(user, room);
		Livechat.logger.debug(`Transfering room ${room._id} by user ${transferredBy._id}`);
		const transferData = { roomId: rid, scope: 'queue', departmentId, transferredBy };
		try {
			this.saveTransferHistory(room, transferData);
			RoutingManager.unassignAgent(inquiry, departmentId);
		} catch (e) {
			this.logger.error(e);
			throw new Meteor.Error('error-returning-inquiry', 'Error returning inquiry to the queue', {
				method: 'livechat:returnRoomAsInquiry',
			});
		}

		callbacks.runAsync('livechat:afterReturnRoomAsInquiry', { room });

		return true;
	},

	sendRequest(postData, callback, attempts = 10) {
		if (!attempts) {
			return;
		}
		const secretToken = settings.get('Livechat_secret_token');
		const headers = { 'X-RocketChat-Livechat-Token': secretToken };
		const options = {
			data: postData,
			...(secretToken !== '' && secretToken !== undefined && { headers }),
		};
		try {
			return HTTP.post(settings.get('Livechat_webhookUrl'), options);
		} catch (e) {
			Livechat.webhookLogger.error(`Response error on ${11 - attempts} try ->`, e);
			// try 10 times after 10 seconds each
			attempts - 1 && Livechat.webhookLogger.warn('Will try again in 10 seconds ...');
			setTimeout(
				Meteor.bindEnvironment(function () {
					Livechat.sendRequest(postData, callback, attempts - 1);
				}),
				10000,
			);
		}
	},

	async getLivechatRoomGuestInfo(room) {
		const visitor = await LivechatVisitors.findOneById(room.v._id);
		const agent = Users.findOneById(room.servedBy && room.servedBy._id);

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

	addAgent(username) {
		check(username, String);

		const user = Users.findOneByUsername(username, { fields: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:addAgent' });
		}

		if (addUserRoles(user._id, ['livechat-agent'])) {
			Users.setOperator(user._id, true);
			this.setUserStatusLivechat(user._id, user.status !== 'offline' ? 'available' : 'not-available');
			return user;
		}

		return false;
	},

	addManager(username) {
		check(username, String);

		const user = Users.findOneByUsername(username, { fields: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:addManager',
			});
		}

		if (addUserRoles(user._id, ['livechat-manager'])) {
			return user;
		}

		return false;
	},

	removeAgent(username) {
		check(username, String);

		const user = Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:removeAgent',
			});
		}

		const { _id } = user;

		if (removeUserFromRoles(_id, ['livechat-agent'])) {
			Users.setOperator(_id, false);
			Users.removeLivechatData(_id);
			this.setUserStatusLivechat(_id, 'not-available');
			LivechatDepartmentAgents.removeByAgentId(_id);
			Promise.await(LivechatVisitors.removeContactManagerByUsername(username));
			return true;
		}

		return false;
	},

	removeManager(username) {
		check(username, String);

		const user = Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:removeManager',
			});
		}

		return removeUserFromRoles(user._id, ['livechat-manager']);
	},

	async removeGuest(_id) {
		check(_id, String);
		const guest = await LivechatVisitors.findOneById(_id, { projection: { _id: 1 } });
		if (!guest) {
			throw new Meteor.Error('error-invalid-guest', 'Invalid guest', {
				method: 'livechat:removeGuest',
			});
		}

		await this.cleanGuestHistory(_id);
		return LivechatVisitors.removeById(_id);
	},

	setUserStatusLivechat(userId, status) {
		const user = Users.setLivechatStatus(userId, status);
		callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });
		return user;
	},

	setUserStatusLivechatIf(userId, status, condition, fields) {
		const user = Promise.await(UsersRaw.setLivechatStatusIf(userId, status, condition, fields));
		callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });
		return user;
	},

	async cleanGuestHistory(_id) {
		const guest = await LivechatVisitors.findOneById(_id);
		if (!guest) {
			throw new Meteor.Error('error-invalid-guest', 'Invalid guest', {
				method: 'livechat:cleanGuestHistory',
			});
		}

		const { token } = guest;
		check(token, String);

		LivechatRooms.findByVisitorToken(token).forEach((room) => {
			FileUpload.removeFilesByRoomId(room._id);
			Messages.removeByRoomId(room._id);
		});

		Subscriptions.removeByVisitorToken(token);
		LivechatRooms.removeByVisitorToken(token);
		LivechatInquiry.removeByVisitorToken(token);
	},

	saveDepartmentAgents(_id, departmentAgents) {
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

		const department = LivechatDepartment.findOneById(_id);
		if (!department) {
			throw new Meteor.Error('error-department-not-found', 'Department not found', {
				method: 'livechat:saveDepartmentAgents',
			});
		}

		return updateDepartmentAgents(_id, departmentAgents, department.enabled);
	},

	saveDepartment(_id, departmentData, departmentAgents) {
		check(_id, Match.Maybe(String));

		const defaultValidations = {
			enabled: Boolean,
			name: String,
			description: Match.Optional(String),
			showOnRegistration: Boolean,
			email: String,
			showOnOfflineForm: Boolean,
			requestTagBeforeClosingChat: Match.Optional(Boolean),
			chatClosingTags: Match.Optional([String]),
			fallbackForwardDepartment: Match.Optional(String),
		};

		// The Livechat Form department support addition/custom fields, so those fields need to be added before validating
		Object.keys(departmentData).forEach((field) => {
			if (!defaultValidations.hasOwnProperty(field)) {
				defaultValidations[field] = Match.OneOf(String, Match.Integer, Boolean);
			}
		});

		check(departmentData, defaultValidations);
		check(
			departmentAgents,
			Match.Maybe({
				upsert: Match.Maybe(Array),
				remove: Match.Maybe(Array),
			}),
		);

		const { requestTagBeforeClosingChat, chatClosingTags, fallbackForwardDepartment } = departmentData;
		if (requestTagBeforeClosingChat && (!chatClosingTags || chatClosingTags.length === 0)) {
			throw new Meteor.Error(
				'error-validating-department-chat-closing-tags',
				'At least one closing tag is required when the department requires tag(s) on closing conversations.',
				{ method: 'livechat:saveDepartment' },
			);
		}

		if (_id) {
			const department = LivechatDepartment.findOneById(_id);
			if (!department) {
				throw new Meteor.Error('error-department-not-found', 'Department not found', {
					method: 'livechat:saveDepartment',
				});
			}
		}

		if (fallbackForwardDepartment === _id) {
			throw new Meteor.Error(
				'error-fallback-department-circular',
				'Cannot save department. Circular reference between fallback department and department',
			);
		}

		const departmentDB = LivechatDepartment.createOrUpdateDepartment(_id, departmentData);
		if (departmentDB && departmentAgents) {
			updateDepartmentAgents(departmentDB._id, departmentAgents, departmentDB.enabled);
		}

		return departmentDB;
	},

	saveAgentInfo(_id, agentData, agentDepartments) {
		check(_id, Match.Maybe(String));
		check(agentData, Object);
		check(agentDepartments, [String]);

		const user = Users.findOneById(_id);
		if (!user || !hasRole(_id, 'livechat-agent')) {
			throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent', {
				method: 'livechat:saveAgentInfo',
			});
		}

		Users.setLivechatData(_id, agentData);
		LivechatDepartment.saveDepartmentsByAgent(user, agentDepartments);

		return true;
	},

	removeDepartment(_id) {
		check(_id, String);

		const department = LivechatDepartment.findOneById(_id, { fields: { _id: 1 } });

		if (!department) {
			throw new Meteor.Error('department-not-found', 'Department not found', {
				method: 'livechat:removeDepartment',
			});
		}
		const ret = LivechatDepartment.removeById(_id);
		const agentsIds = LivechatDepartmentAgents.findByDepartmentId(_id)
			.fetch()
			.map((agent) => agent.agentId);
		LivechatDepartmentAgents.removeByDepartmentId(_id);
		LivechatDepartment.unsetFallbackDepartmentByDepartmentId(_id);
		if (ret) {
			Meteor.defer(() => {
				callbacks.run('livechat.afterRemoveDepartment', { department, agentsIds });
			});
		}
		return ret;
	},

	showConnecting() {
		const { showConnecting } = RoutingManager.getConfig();
		return showConnecting;
	},

	sendEmail(from, to, replyTo, subject, html) {
		Mailer.send({
			to,
			from,
			replyTo,
			subject,
			html,
		});
	},

	async sendTranscript({ token, rid, email, subject, user }) {
		check(rid, String);
		check(email, String);
		Livechat.logger.debug(`Sending conversation transcript of room ${rid} to user with token ${token}`);

		const room = LivechatRooms.findOneById(rid);

		const visitor = await LivechatVisitors.getVisitorByToken(token, {
			projection: { _id: 1, token: 1, language: 1, username: 1, name: 1 },
		});
		const userLanguage = (visitor && visitor.language) || settings.get('Language') || 'en';
		const timezone = getTimezone(user);
		Livechat.logger.debug(`Transcript will be sent using ${timezone} as timezone`);

		// allow to only user to send transcripts from their own chats
		if (!room || room.t !== 'l' || !room.v || room.v.token !== token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		const showAgentInfo = settings.get('Livechat_show_agent_info');
		const ignoredMessageTypes = [
			'livechat_navigation_history',
			'livechat_transcript_history',
			'command',
			'livechat-close',
			'livechat-started',
			'livechat_video_call',
		];
		const messages = Messages.findVisibleByRoomIdNotContainingTypes(rid, ignoredMessageTypes, {
			sort: { ts: 1 },
		});

		let html = '<div> <hr>';
		messages.forEach((message) => {
			let author;
			if (message.u._id === visitor._id) {
				author = TAPi18n.__('You', { lng: userLanguage });
			} else {
				author = showAgentInfo ? message.u.name || message.u.username : TAPi18n.__('Agent', { lng: userLanguage });
			}

			const datetime = moment.tz(message.ts, timezone).locale(userLanguage).format('LLL');
			const singleMessage = `
				<p><strong>${author}</strong>  <em>${datetime}</em></p>
				<p>${message.msg}</p>
			`;
			html += singleMessage;
		});

		html = `${html}</div>`;

		let fromEmail = settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = settings.get('From_Email');
		}

		const mailSubject = subject || TAPi18n.__('Transcript_of_your_livechat_conversation', { lng: userLanguage });

		this.sendEmail(fromEmail, email, fromEmail, mailSubject, html);

		Meteor.defer(() => {
			callbacks.run('livechat.sendTranscript', messages, email);
		});

		let type = 'user';
		if (!user) {
			user = Users.findOneById('rocket.cat', { fields: { _id: 1, username: 1, name: 1 } });
			type = 'visitor';
		}

		Messages.createTranscriptHistoryWithRoomIdMessageAndUser(room._id, '', user, {
			requestData: { type, visitor, user },
		});
		return true;
	},

	getRoomMessages({ rid }) {
		check(rid, String);

		const isLivechat = Promise.await(Rooms.findByTypeInIds('l', [rid])).count();

		if (!isLivechat) {
			throw new Meteor.Error('invalid-room');
		}

		const ignoredMessageTypes = [
			'livechat_navigation_history',
			'livechat_transcript_history',
			'command',
			'livechat-close',
			'livechat-started',
			'livechat_video_call',
		];

		return Messages.findVisibleByRoomIdNotContainingTypes(rid, ignoredMessageTypes, {
			sort: { ts: 1 },
		}).fetch();
	},

	requestTranscript({ rid, email, subject, user }) {
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

		const room = LivechatRooms.findOneById(rid, { _id: 1, open: 1, transcriptRequest: 1 });

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

		LivechatRooms.requestTranscriptByRoomId(rid, transcriptRequest);
		return true;
	},

	notifyGuestStatusChanged(token, status) {
		LivechatInquiry.updateVisitorStatus(token, status);
		LivechatRooms.updateVisitorStatus(token, status);
	},

	sendOfflineMessage(data = {}) {
		if (!settings.get('Livechat_display_offline_form')) {
			return false;
		}

		const { message, name, email, department, host } = data;
		const emailMessage = `${message}`.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');

		let html = '<h1>New livechat message</h1>';
		if (host && host !== '') {
			html = html.concat(`<p><strong>Sent from:</strong><a href='${host}'> ${host}</a></p>`);
		}
		html = html.concat(`
			<p><strong>Visitor name:</strong> ${name}</p>
			<p><strong>Visitor email:</strong> ${email}</p>
			<p><strong>Message:</strong><br>${emailMessage}</p>`);

		let fromEmail = settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = settings.get('From_Email');
		}

		if (settings.get('Livechat_validate_offline_email')) {
			const emailDomain = email.substr(email.lastIndexOf('@') + 1);

			try {
				dnsResolveMx(emailDomain);
			} catch (e) {
				throw new Meteor.Error('error-invalid-email-address', 'Invalid email address', {
					method: 'livechat:sendOfflineMessage',
				});
			}
		}

		let emailTo = settings.get('Livechat_offline_email');
		if (department && department !== '') {
			const dep = LivechatDepartment.findOneByIdOrName(department);
			emailTo = dep.email || emailTo;
		}

		const from = `${name} - ${email} <${fromEmail}>`;
		const replyTo = `${name} <${email}>`;
		const subject = `Livechat offline message from ${name}: ${`${emailMessage}`.substring(0, 20)}`;
		this.sendEmail(from, emailTo, replyTo, subject, html);

		Meteor.defer(() => {
			callbacks.run('livechat.offlineMessage', data);
		});

		return true;
	},

	notifyAgentStatusChanged(userId, status) {
		callbacks.runAsync('livechat.agentStatusChanged', { userId, status });
		if (!settings.get('Livechat_show_agent_info')) {
			return;
		}

		LivechatRooms.findOpenByAgent(userId).forEach((room) => {
			notifications.streamLivechatRoom.emit(room._id, {
				type: 'agentStatus',
				status,
			});
		});
	},

	allowAgentChangeServiceStatus(statusLivechat, agentId) {
		if (statusLivechat !== 'available') {
			return true;
		}

		return Promise.await(businessHourManager.allowAgentChangeServiceStatus(agentId));
	},

	notifyRoomVisitorChange(roomId, visitor) {
		notifications.streamLivechatRoom.emit(roomId, {
			type: 'visitorData',
			visitor,
		});
	},

	changeRoomVisitor(userId, roomId, visitor) {
		const user = Promise.await(Users.findOneById(userId));
		if (!user) {
			throw new Error('error-user-not-found');
		}

		if (!hasPermission(userId, 'change-livechat-room-visitor')) {
			throw new Error('error-not-authorized');
		}

		const room = Promise.await(LivechatRooms.findOneById(roomId, { ...roomAccessAttributes, _id: 1, t: 1 }));

		if (!room) {
			throw new Meteor.Error('invalid-room');
		}

		if (!canAccessRoom(room, user)) {
			throw new Error('error-not-allowed');
		}

		LivechatRooms.changeVisitorByRoomId(room._id, visitor);

		Livechat.notifyRoomVisitorChange(room._id, visitor);

		return LivechatRooms.findOneById(roomId);
	},
	async updateLastChat(contactId, lastChat) {
		const updateUser = {
			$set: {
				lastChat,
			},
		};
		await LivechatVisitors.updateById(contactId, updateUser);
	},
	updateCallStatus(callId, rid, status, user) {
		Rooms.setCallStatus(rid, status);
		if (status === 'ended' || status === 'declined') {
			if (Promise.await(VideoConf.declineLivechatCall(callId))) {
				return;
			}

			return updateMessage({ _id: callId, msg: status, actionLinks: [], webRtcCallEndTs: new Date() }, user);
		}
	},
};

settings.watch('Livechat_history_monitor_type', (value) => {
	Livechat.historyMonitorType = value;
});
