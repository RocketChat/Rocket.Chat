import dns from 'dns';

import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { HTTP } from 'meteor/http';
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import UAParser from 'ua-parser-js';

import { QueueManager } from './QueueManager';
import { RoutingManager } from './RoutingManager';
import { Analytics } from './Analytics';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
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
	LivechatVisitors,
	LivechatOfficeHour,
	LivechatInquiry,
} from '../../../models';
import { Logger } from '../../../logger';
import { addUserRoles, hasPermission, hasRole, removeUserFromRoles } from '../../../authorization';
import * as Mailer from '../../../../server/mailer';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { updateMessage } from '../../../lib/server/functions/updateMessage';
import { deleteMessage } from '../../../lib/server/functions/deleteMessage';
import { FileUpload } from '../../../file-upload/server';
import { normalizeTransferredByData, parseAgentCustomFields } from './Helper';
import { Apps, AppEvents } from '../../../apps/server';

export const Livechat = {
	Analytics,
	historyMonitorType: 'url',

	logger: new Logger('Livechat', {
		sections: {
			webhook: 'Webhook',
		},
	}),

	online(department) {
		if (settings.get('Livechat_accept_chats_with_no_agents')) {
			return true;
		}

		if (settings.get('Livechat_assign_new_conversation_to_bot')) {
			const botAgents = Livechat.getBotAgents(department);
			if (botAgents && botAgents.count() > 0) {
				return true;
			}
		}

		const onlineAgents = Livechat.getOnlineAgents(department);
		return (onlineAgents && onlineAgents.count() > 0) || settings.get('Livechat_accept_chats_with_no_agents');
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

	getOnlineAgents(department) {
		if (department) {
			return LivechatDepartmentAgents.getOnlineForDepartment(department);
		}
		return Users.findOnlineAgents();
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
		let room = LivechatRooms.findOneById(message.rid);
		let newRoom = false;

		if (room && !room.open) {
			message.rid = Random.id();
			room = null;
		}

		if (room == null) {
			const defaultAgent = callbacks.run('livechat.checkDefaultAgentOnNewRoom', agent, guest);
			// if no department selected verify if there is at least one active and pick the first
			if (!defaultAgent && !guest.department) {
				const department = this.getRequiredDepartment();

				if (department) {
					guest.department = department._id;
				}
			}

			// delegate room creation to QueueManager
			room = await QueueManager.requestRoom({ guest, message, roomInfo, agent: defaultAgent, extraData });
			newRoom = true;
		}

		if (!room || room.v.token !== guest.token) {
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
		// return messages;
		return _.extend(sendMessage(guest, message, room), { newRoom, showConnecting: this.showConnecting() });
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
			throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', { method: 'livechatUpdateMessage' });
		}

		updateMessage(message, guest);

		return true;
	},

	deleteMessage({ guest, message }) {
		check(message, Match.ObjectIncluding({ _id: String }));

		const msg = Messages.findOneById(message._id);
		if (!msg || !msg._id) {
			return;
		}

		const deleteAllowed = settings.get('Message_AllowDeleting');
		const editOwn = msg.u && msg.u._id === guest._id;

		if (!deleteAllowed || !editOwn) {
			throw new Meteor.Error('error-action-not-allowed', 'Message deleting not allowed', { method: 'livechatDeleteMessage' });
		}

		deleteMessage(message, guest);

		return true;
	},

	registerGuest({ token, name, email, department, phone, username, connectionData } = {}) {
		check(token, String);

		let userId;
		const updateUser = {
			$set: {
				token,
			},
		};

		const user = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (user) {
			userId = user._id;
		} else {
			if (!username) {
				username = LivechatVisitors.getNextVisitorUsername();
			}

			let existingUser = null;

			if (s.trim(email) !== '' && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(email))) {
				userId = existingUser._id;
			} else {
				const userData = {
					username,
				};

				if (settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations')) {
					const connection = this.connection || connectionData;
					if (connection && connection.httpHeaders) {
						userData.userAgent = connection.httpHeaders['user-agent'];
						userData.ip = connection.httpHeaders['x-real-ip'] || connection.httpHeaders['x-forwarded-for'] || connection.clientAddress;
						userData.host = connection.httpHeaders.host;
					}
				}

				userId = LivechatVisitors.insert(userData);
			}
		}

		if (phone) {
			updateUser.$set.phone = [
				{ phoneNumber: phone.number },
			];
		}

		if (email && email.trim() !== '') {
			updateUser.$set.visitorEmails = [
				{ address: email },
			];
		}

		if (name) {
			updateUser.$set.name = name;
		}

		if (!department) {
			Object.assign(updateUser, { $unset: { department: 1 } });
		} else {
			const dep = LivechatDepartment.findOneByIdOrName(department);
			updateUser.$set.department = dep && dep._id;
		}

		LivechatVisitors.updateById(userId, updateUser);

		return userId;
	},

	setDepartmentForGuest({ token, department } = {}) {
		check(token, String);

		const updateUser = {
			$set: {
				department,
			},
		};

		const user = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });
		if (user) {
			return LivechatVisitors.updateById(user._id, updateUser);
		}
		return false;
	},

	saveGuest({ _id, name, email, phone, livechatData = {} }, userId) {
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
		const ret = LivechatVisitors.saveGuestById(_id, updateData);

		Meteor.defer(() => {
			callbacks.run('livechat.saveGuest', updateData);
		});

		return ret;
	},

	closeRoom({ user, visitor, room, comment, options = {} }) {
		if (!room || room.t !== 'l' || !room.open) {
			return false;
		}

		const params = callbacks.run('livechat.beforeCloseRoom', { room, options });
		const { extraData } = params;

		const now = new Date();
		const { _id: rid, servedBy } = room;
		const serviceTimeDuration = servedBy && (now.getTime() - servedBy.ts) / 1000;

		const closeData = {
			closedAt: now,
			chatDuration: (now.getTime() - room.ts) / 1000,
			...serviceTimeDuration && { serviceTimeDuration },
			...extraData,
		};

		if (user) {
			closeData.closer = 'user';
			closeData.closedBy = {
				_id: user._id,
				username: user.username,
			};
		} else if (visitor) {
			closeData.closer = 'visitor';
			closeData.closedBy = {
				_id: visitor._id,
				username: visitor.username,
			};
		}

		LivechatRooms.closeByRoomId(rid, closeData);
		LivechatInquiry.removeByRoomId(rid);

		const message = {
			t: 'livechat-close',
			msg: comment,
			groupable: false,
		};

		// Retreive the closed room
		room = LivechatRooms.findOneByIdOrName(rid);

		sendMessage(user || visitor, message, room);

		if (servedBy) {
			Subscriptions.removeByRoomIdAndUserId(rid, servedBy._id);
		}
		Messages.createCommandWithRoomIdAndUser('promptTranscript', rid, closeData.closedBy);

		Meteor.defer(() => {
			/**
			 * @deprecated the `AppEvents.ILivechatRoomClosedHandler` event will be removed
			 * in the next major version of the Apps-Engine
			 */
			Apps.getBridges().getListenerBridge().livechatEvent(AppEvents.ILivechatRoomClosedHandler, room);
			Apps.getBridges().getListenerBridge().livechatEvent(AppEvents.IPostLivechatRoomClosed, room);
			callbacks.run('livechat.closeRoom', room);
		});

		return true;
	},

	removeRoom(rid) {
		check(rid, String);
		const room = LivechatRooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:removeRoom' });
		}

		Messages.removeByRoomId(rid);
		Subscriptions.removeByRoomId(rid);
		LivechatInquiry.removeByRoomId(rid);
		return LivechatRooms.removeById(rid);
	},


	setCustomFields({ token, key, value, overwrite } = {}) {
		check(token, String);
		check(key, String);
		check(value, String);
		check(overwrite, Boolean);

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

	getInitSettings() {
		const rcSettings = {};

		Settings.findNotHiddenPublic([
			'Livechat_title',
			'Livechat_title_color',
			'Livechat_enabled',
			'Livechat_registration_form',
			'Livechat_allow_switching_departments',
			'Livechat_offline_title',
			'Livechat_offline_title_color',
			'Livechat_offline_message',
			'Livechat_offline_success_message',
			'Livechat_offline_form_unavailable',
			'Livechat_display_offline_form',
			'Livechat_videocall_enabled',
			'Jitsi_Enabled',
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
		]).forEach((setting) => {
			rcSettings[setting._id] = setting.value;
		});

		settings.get('Livechat_history_monitor_type', (key, value) => {
			rcSettings[key] = value;
		});

		rcSettings.Livechat_Show_Connecting = this.showConnecting();

		return rcSettings;
	},

	saveRoomInfo(roomData, guestData, userId) {
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
			callbacks.run('livechat.saveRoom', roomData);
		});

		if (!_.isEmpty(guestData.name)) {
			const { _id: rid } = roomData;
			const { name } = guestData;
			return Rooms.setFnameById(rid, name)
				&& LivechatInquiry.setNameByRoomId(rid, name)
				// This one needs to be the last since the agent may not have the subscription
				// when the conversation is in the queue, then the result will be 0(zero)
				&& Subscriptions.updateDisplayNameByRoomId(rid, name);
		}
	},

	closeOpenChats(userId, comment) {
		const user = Users.findOneById(userId);
		LivechatRooms.findOpenByAgent(userId).forEach((room) => {
			this.closeRoom({ user, room, comment });
		});
	},

	forwardOpenChats(userId) {
		LivechatRooms.findOpenByAgent(userId).forEach((room) => {
			const guest = LivechatVisitors.findOneById(room.v._id);
			const user = Users.findOneById(userId);
			const { _id, username, name } = user;
			const transferredBy = normalizeTransferredByData({ _id, username, name }, room);
			this.transfer(room, guest, { roomId: room._id, transferredBy, departmentId: guest.department });
		});
	},

	savePageHistory(token, roomId, pageInfo) {
		if (pageInfo.change === Livechat.historyMonitorType) {
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

			return Messages.createNavigationHistoryWithRoomIdMessageAndUser(roomId, `${ pageTitle } - ${ pageUrl }`, user, extraData);
		}
	},

	saveTransferHistory(room, transferData) {
		const { departmentId: previousDepartment } = room;
		const { department: nextDepartment, transferredBy, transferredTo, scope, comment } = transferData;

		check(transferredBy, Match.ObjectIncluding({
			_id: String,
			username: String,
			name: Match.Maybe(String),
			type: String,
		}));

		const { _id, username } = transferredBy;

		const transfer = {
			transferData: {
				transferredBy,
				ts: new Date(),
				scope: scope || (nextDepartment ? 'department' : 'agent'),
				comment,
				...previousDepartment && { previousDepartment },
				...nextDepartment && { nextDepartment },
				...transferredTo && { transferredTo },
			},
		};

		return Messages.createTransferHistoryWithRoomIdMessageAndUser(room._id, '', { _id, username }, transfer);
	},

	async transfer(room, guest, transferData) {
		if (transferData.departmentId) {
			transferData.department = LivechatDepartment.findOneById(transferData.departmentId, { fields: { name: 1 } });
		}

		return RoutingManager.transferRoom(room, guest, transferData);
	},

	returnRoomAsInquiry(rid, departmentId) {
		const room = LivechatRooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:returnRoomAsInquiry' });
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', { method: 'livechat:returnRoomAsInquiry' });
		}

		if (!room.servedBy) {
			return false;
		}

		const user = Users.findOne(room.servedBy._id);
		if (!user || !user._id) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:returnRoomAsInquiry' });
		}

		// find inquiry corresponding to room
		const inquiry = LivechatInquiry.findOne({ rid });
		if (!inquiry) {
			return false;
		}

		const transferredBy = normalizeTransferredByData(user, room);
		const transferData = { roomId: rid, scope: 'queue', departmentId, transferredBy };
		try {
			this.saveTransferHistory(room, transferData);
			RoutingManager.unassignAgent(inquiry, departmentId);
			Meteor.defer(() => callbacks.run('livechat.chatQueued', LivechatRooms.findOneById(rid)));
		} catch (e) {
			console.error(e);
			throw new Meteor.Error('error-returning-inquiry', 'Error returning inquiry to the queue', { method: 'livechat:returnRoomAsInquiry' });
		}

		return true;
	},

	sendRequest(postData, callback, trying = 1) {
		try {
			const options = { data: postData };
			const secretToken = settings.get('Livechat_secret_token');
			if (secretToken !== '' && secretToken !== undefined) {
				Object.assign(options, { headers: { 'X-RocketChat-Livechat-Token': secretToken } });
			}
			return HTTP.post(settings.get('Livechat_webhookUrl'), options);
		} catch (e) {
			Livechat.logger.webhook.error(`Response error on ${ trying } try ->`, e);
			// try 10 times after 10 seconds each
			if (trying < 10) {
				Livechat.logger.webhook.warn('Will try again in 10 seconds ...');
				trying++;
				setTimeout(Meteor.bindEnvironment(() => {
					Livechat.sendRequest(postData, callback, trying);
				}), 10000);
			}
		}
	},

	getLivechatRoomGuestInfo(room) {
		const visitor = LivechatVisitors.findOneById(room.v._id);
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
				os: ua.getOS().name && `${ ua.getOS().name } ${ ua.getOS().version }`,
				browser: ua.getBrowser().name && `${ ua.getBrowser().name } ${ ua.getBrowser().version }`,
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
				...customFields && { customFields },
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

		if (addUserRoles(user._id, 'livechat-agent')) {
			Users.setOperator(user._id, true);
			this.setUserStatusLivechat(user._id, 'available');
			return user;
		}

		return false;
	},

	addManager(username) {
		check(username, String);

		const user = Users.findOneByUsername(username, { fields: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:addManager' });
		}

		if (addUserRoles(user._id, 'livechat-manager')) {
			return user;
		}

		return false;
	},

	removeAgent(username) {
		check(username, String);

		const user = Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:removeAgent' });
		}

		const { _id } = user;

		if (removeUserFromRoles(_id, 'livechat-agent')) {
			Users.setOperator(_id, false);
			Users.removeLivechatData(_id);
			this.setUserStatusLivechat(_id, 'not-available');
			LivechatDepartmentAgents.removeByAgentId(_id);
			return true;
		}

		return false;
	},

	removeManager(username) {
		check(username, String);

		const user = Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:removeManager' });
		}

		return removeUserFromRoles(user._id, 'livechat-manager');
	},

	removeGuest(_id) {
		check(_id, String);
		const guest = LivechatVisitors.findOneById(_id);
		if (!guest) {
			throw new Meteor.Error('error-invalid-guest', 'Invalid guest', { method: 'livechat:removeGuest' });
		}

		this.cleanGuestHistory(_id);
		return LivechatVisitors.removeById(_id);
	},

	setUserStatusLivechat(userId, status) {
		const user = Users.setLivechatStatus(userId, status);
		callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });
		return user;
	},

	cleanGuestHistory(_id) {
		const guest = LivechatVisitors.findOneById(_id);
		if (!guest) {
			throw new Meteor.Error('error-invalid-guest', 'Invalid guest', { method: 'livechat:cleanGuestHistory' });
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
		check(departmentAgents, [
			Match.ObjectIncluding({
				agentId: String,
				username: String,
			}),
		]);

		const department = LivechatDepartment.findOneById(_id);
		if (!department) {
			throw new Meteor.Error('error-department-not-found', 'Department not found', { method: 'livechat:saveDepartmentAgents' });
		}

		return LivechatDepartment.createOrUpdateDepartment(_id, department, departmentAgents);
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
		};

		// The Livechat Form department support addition/custom fields, so those fields need to be added before validating
		Object.keys(departmentData).forEach((field) => {
			if (!defaultValidations.hasOwnProperty(field)) {
				defaultValidations[field] = Match.OneOf(String, Match.Integer, Boolean);
			}
		});

		check(departmentData, defaultValidations);

		check(departmentAgents, Match.Maybe([
			Match.ObjectIncluding({
				agentId: String,
				username: String,
			}),
		]));

		const { requestTagBeforeClosingChat, chatClosingTags } = departmentData;
		if (requestTagBeforeClosingChat && (!chatClosingTags || chatClosingTags.length === 0)) {
			throw new Meteor.Error('error-validating-department-chat-closing-tags', 'At least one closing tag is required when the department requires tag(s) on closing conversations.', { method: 'livechat:saveDepartment' });
		}

		if (_id) {
			const department = LivechatDepartment.findOneById(_id);
			if (!department) {
				throw new Meteor.Error('error-department-not-found', 'Department not found', { method: 'livechat:saveDepartment' });
			}
		}

		return LivechatDepartment.createOrUpdateDepartment(_id, departmentData, departmentAgents);
	},

	saveAgentInfo(_id, agentData, agentDepartments) {
		check(_id, Match.Maybe(String));
		check(agentData, Object);
		check(agentDepartments, [String]);


		const user = Users.findOneById(_id);
		if (!user || !hasRole(_id, 'livechat-agent')) {
			throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent', { method: 'livechat:saveAgentInfo' });
		}

		Users.setLivechatData(_id, agentData);
		LivechatDepartment.saveDepartmentsByAgent(user, agentDepartments);

		return true;
	},

	removeDepartment(_id) {
		check(_id, String);

		const department = LivechatDepartment.findOneById(_id, { fields: { _id: 1 } });

		if (!department) {
			throw new Meteor.Error('department-not-found', 'Department not found', { method: 'livechat:removeDepartment' });
		}

		const ret = LivechatDepartment.removeById(_id);
		if (ret) {
			Meteor.defer(() => {
				callbacks.run('livechat.afterRemoveDepartment', department);
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

	sendTranscript({ token, rid, email }) {
		check(rid, String);
		check(email, String);

		const room = LivechatRooms.findOneById(rid);

		const visitor = LivechatVisitors.getVisitorByToken(token);
		const userLanguage = (visitor && visitor.language) || settings.get('Language') || 'en';

		// allow to only user to send transcripts from their own chats
		if (!room || room.t !== 'l' || !room.v || room.v.token !== token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		const messages = Messages.findVisibleByRoomIdNotContainingTypes(rid, ['livechat_navigation_history'], { sort: { ts: 1 } });

		let html = '<div> <hr>';
		messages.forEach((message) => {
			if (message.t && ['command', 'livechat-close', 'livechat_video_call'].indexOf(message.t) !== -1) {
				return;
			}

			let author;
			if (message.u._id === visitor._id) {
				author = TAPi18n.__('You', { lng: userLanguage });
			} else {
				author = message.u.username;
			}

			const datetime = moment(message.ts).locale(userLanguage).format('LLL');
			const singleMessage = `
				<p><strong>${ author }</strong>  <em>${ datetime }</em></p>
				<p>${ message.msg }</p>
			`;
			html += singleMessage;
		});

		html = `${ html }</div>`;

		let fromEmail = settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = settings.get('From_Email');
		}

		const subject = TAPi18n.__('Transcript_of_your_livechat_conversation', { lng: userLanguage });

		this.sendEmail(fromEmail, email, fromEmail, subject, html);

		Meteor.defer(() => {
			callbacks.run('livechat.sendTranscript', messages, email);
		});

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
		const emailMessage = `${ message }`.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');

		let html = '<h1>New livechat message</h1>';
		if (host && host !== '') {
			html = html.concat(`<p><strong>Sent from:</strong><a href='${ host }'> ${ host }</a></p>`);
		}
		html = html.concat(`
			<p><strong>Visitor name:</strong> ${ name }</p>
			<p><strong>Visitor email:</strong> ${ email }</p>
			<p><strong>Message:</strong><br>${ emailMessage }</p>`,
		);

		let fromEmail = settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = settings.get('From_Email');
		}

		if (settings.get('Livechat_validate_offline_email')) {
			const emailDomain = email.substr(email.lastIndexOf('@') + 1);

			try {
				Meteor.wrapAsync(dns.resolveMx)(emailDomain);
			} catch (e) {
				throw new Meteor.Error('error-invalid-email-address', 'Invalid email address', { method: 'livechat:sendOfflineMessage' });
			}
		}

		let emailTo = settings.get('Livechat_offline_email');
		if (department && department !== '') {
			const dep = LivechatDepartment.findOneByIdOrName(department);
			emailTo = dep.email || emailTo;
		}

		const from = `${ name } - ${ email } <${ fromEmail }>`;
		const replyTo = `${ name } <${ email }>`;
		const subject = `Livechat offline message from ${ name }: ${ `${ emailMessage }`.substring(0, 20) }`;
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
			Livechat.stream.emit(room._id, {
				type: 'agentStatus',
				status,
			});
		});
	},

	allowAgentChangeServiceStatus(statusLivechat) {
		if (!settings.get('Livechat_enable_office_hours')) {
			return true;
		}

		if (settings.get('Livechat_allow_online_agents_outside_office_hours')) {
			return true;
		}

		if (statusLivechat !== 'available') {
			return true;
		}

		return LivechatOfficeHour.isNowWithinHours();
	},
};

Livechat.stream = new Meteor.Streamer('livechat-room');

Livechat.stream.allowRead((roomId, extraData) => {
	const room = LivechatRooms.findOneById(roomId);

	if (!room) {
		console.warn(`Invalid eventName: "${ roomId }"`);
		return false;
	}

	if (room.t === 'l' && extraData && extraData.visitorToken && room.v.token === extraData.visitorToken) {
		return true;
	}
	return false;
});

settings.get('Livechat_history_monitor_type', (key, value) => {
	Livechat.historyMonitorType = value;
});
