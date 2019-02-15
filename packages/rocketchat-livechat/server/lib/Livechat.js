import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { HTTP } from 'meteor/http';
import { RocketChat } from 'meteor/rocketchat:lib';
import { Logger } from 'meteor/rocketchat:logger';
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import dns from 'dns';
import UAParser from 'ua-parser-js';
import * as Mailer from 'meteor/rocketchat:mailer';
import { LivechatDepartmentAgents, LivechatDepartment, LivechatCustomField } from '../models';
import { LivechatInquiry } from '../../lib/LivechatInquiry';

import LivechatVisitors from '../models/LivechatVisitors';
import { Analytics } from './Analytics';

RocketChat.Livechat = {
	Analytics,
	historyMonitorType: 'url',

	logger: new Logger('Livechat', {
		sections: {
			webhook: 'Webhook',
		},
	}),

	getNextAgent(department) {
		if (RocketChat.settings.get('Livechat_Routing_Method') === 'External') {
			for (let i = 0; i < 10; i++) {
				try {
					const queryString = department ? `?departmentId=${ department }` : '';
					const result = HTTP.call('GET', `${ RocketChat.settings.get('Livechat_External_Queue_URL') }${ queryString }`, {
						headers: {
							'User-Agent': 'RocketChat Server',
							Accept: 'application/json',
							'X-RocketChat-Secret-Token': RocketChat.settings.get('Livechat_External_Queue_Token'),
						},
					});

					if (result && result.data && result.data.username) {
						const agent = RocketChat.models.Users.findOneOnlineAgentByUsername(result.data.username);

						if (agent) {
							return {
								agentId: agent._id,
								username: agent.username,
							};
						}
					}
				} catch (e) {
					console.error('Error requesting agent from external queue.', e);
					break;
				}
			}
			throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
		} else if (department) {
			return LivechatDepartmentAgents.getNextAgentForDepartment(department);
		}
		return RocketChat.models.Users.getNextAgent();
	},
	getAgents(department) {
		if (department) {
			return LivechatDepartmentAgents.findByDepartmentId(department);
		}
		return RocketChat.models.Users.findAgents();
	},
	getOnlineAgents(department) {
		if (department) {
			return LivechatDepartmentAgents.getOnlineForDepartment(department);
		}
		return RocketChat.models.Users.findOnlineAgents();
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
			return onlineAgents.count() > 0;
		});
	},
	getRoom(guest, message, roomInfo, agent) {
		let room = RocketChat.models.Rooms.findOneById(message.rid);
		let newRoom = false;

		if (room && !room.open) {
			message.rid = Random.id();
			room = null;
		}

		if (room == null) {
			// if no department selected verify if there is at least one active and pick the first
			if (!agent && !guest.department) {
				const department = this.getRequiredDepartment();

				if (department) {
					guest.department = department._id;
				}
			}

			// delegate room creation to QueueMethods
			const routingMethod = RocketChat.settings.get('Livechat_Routing_Method');
			room = RocketChat.QueueMethods[routingMethod](guest, message, roomInfo, agent);

			newRoom = true;
		}

		if (!room || room.v.token !== guest.token) {
			throw new Meteor.Error('cannot-access-room');
		}

		if (newRoom) {
			RocketChat.models.Messages.setRoomIdByToken(guest.token, room._id);
		}

		return { room, newRoom };
	},

	sendMessage({ guest, message, roomInfo, agent }) {
		const { room, newRoom } = this.getRoom(guest, message, roomInfo, agent);
		if (guest.name) {
			message.alias = guest.name;
		}

		// return messages;
		return _.extend(RocketChat.sendMessage(guest, message, room), { newRoom, showConnecting: this.showConnecting() });
	},

	updateMessage({ guest, message }) {
		check(message, Match.ObjectIncluding({ _id: String }));

		const originalMessage = RocketChat.models.Messages.findOneById(message._id);
		if (!originalMessage || !originalMessage._id) {
			return;
		}

		const editAllowed = RocketChat.settings.get('Message_AllowEditing');
		const editOwn = originalMessage.u && originalMessage.u._id === guest._id;

		if (!editAllowed || !editOwn) {
			throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', { method: 'livechatUpdateMessage' });
		}

		RocketChat.updateMessage(message, guest);

		return true;
	},

	deleteMessage({ guest, message }) {
		check(message, Match.ObjectIncluding({ _id: String }));

		const msg = RocketChat.models.Messages.findOneById(message._id);
		if (!msg || !msg._id) {
			return;
		}

		const deleteAllowed = RocketChat.settings.get('Message_AllowDeleting');
		const editOwn = msg.u && msg.u._id === guest._id;

		if (!deleteAllowed || !editOwn) {
			throw new Meteor.Error('error-action-not-allowed', 'Message deleting not allowed', { method: 'livechatDeleteMessage' });
		}

		RocketChat.deleteMessage(message, guest);

		return true;
	},

	registerGuest({ token, name, email, department, phone, username } = {}) {
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

				const storeHttpHeaderData = RocketChat.settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations');

				if (this.connection && storeHttpHeaderData) {
					userData.userAgent = this.connection.httpHeaders['user-agent'];
					userData.ip = this.connection.httpHeaders['x-real-ip'] || this.connection.httpHeaders['x-forwarded-for'] || this.connection.clientAddress;
					userData.host = this.connection.httpHeaders.host;
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

		if (department) {
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

	saveGuest({ _id, name, email, phone }) {
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
		const ret = LivechatVisitors.saveGuestById(_id, updateData);

		Meteor.defer(() => {
			RocketChat.callbacks.run('livechat.saveGuest', updateData);
		});

		return ret;
	},

	closeRoom({ user, visitor, room, comment }) {
		if (!room || room.t !== 'l' || !room.open) {
			return false;
		}

		const now = new Date();

		const closeData = {
			closedAt: now,
			chatDuration: (now.getTime() - room.ts) / 1000,
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

		RocketChat.models.Rooms.closeByRoomId(room._id, closeData);
		LivechatInquiry.closeByRoomId(room._id, closeData);

		const message = {
			t: 'livechat-close',
			msg: comment,
			groupable: false,
		};

		RocketChat.sendMessage(user, message, room);

		if (room.servedBy) {
			RocketChat.models.Subscriptions.hideByRoomIdAndUserId(room._id, room.servedBy._id);
		}
		RocketChat.models.Messages.createCommandWithRoomIdAndUser('promptTranscript', room._id, closeData.closedBy);

		Meteor.defer(() => {
			RocketChat.callbacks.run('livechat.closeRoom', room);
		});

		return true;
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

		if (customField.scope === 'room') {
			return RocketChat.models.Rooms.updateLivechatDataByToken(token, key, value, overwrite);
		} else {
			return LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
		}
	},

	getInitSettings() {
		const settings = {};

		RocketChat.models.Settings.findNotHiddenPublic([
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
			'Livechat_name_field_registration_form',
			'Livechat_email_field_registration_form',
			'Livechat_registration_form_message',
			'Livechat_force_accept_data_processing_consent',
			'Livechat_data_processing_consent_text',
		]).forEach((setting) => {
			settings[setting._id] = setting.value;
		});

		RocketChat.settings.get('Livechat_history_monitor_type', (key, value) => {
			settings[key] = value;
		});

		settings.Livechat_Show_Connecting = this.showConnecting();

		return settings;
	},

	saveRoomInfo(roomData, guestData) {
		if ((roomData.topic != null || roomData.tags != null) && !RocketChat.models.Rooms.setTopicAndTagsById(roomData._id, roomData.topic, roomData.tags)) {
			return false;
		}

		Meteor.defer(() => {
			RocketChat.callbacks.run('livechat.saveRoom', roomData);
		});

		if (!_.isEmpty(guestData.name)) {
			return RocketChat.models.Rooms.setFnameById(roomData._id, guestData.name) && RocketChat.models.Subscriptions.updateDisplayNameByRoomId(roomData._id, guestData.name);
		}
	},

	closeOpenChats(userId, comment) {
		const user = RocketChat.models.Users.findOneById(userId);
		RocketChat.models.Rooms.findOpenByAgent(userId).forEach((room) => {
			this.closeRoom({ user, room, comment });
		});
	},

	forwardOpenChats(userId) {
		RocketChat.models.Rooms.findOpenByAgent(userId).forEach((room) => {
			const guest = LivechatVisitors.findOneById(room.v._id);
			this.transfer(room, guest, { departmentId: guest.department });
		});
	},

	savePageHistory(token, roomId, pageInfo) {
		if (pageInfo.change === RocketChat.Livechat.historyMonitorType) {

			const user = RocketChat.models.Users.findOneById('rocket.cat');

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

			if (!RocketChat.settings.get('Livechat_Visitor_navigation_as_a_message')) {
				extraData._hidden = true;
			}

			return RocketChat.models.Messages.createNavigationHistoryWithRoomIdMessageAndUser(roomId, `${ pageTitle } - ${ pageUrl }`, user, extraData);
		}

		return;
	},

	transfer(room, guest, transferData) {
		let agent;

		if (transferData.userId) {
			const user = RocketChat.models.Users.findOneOnlineAgentById(transferData.userId);
			if (!user) {
				return false;
			}

			const { _id: agentId, username } = user;
			agent = Object.assign({}, { agentId, username });
		} else if (RocketChat.settings.get('Livechat_Routing_Method') !== 'Guest_Pool') {
			agent = RocketChat.Livechat.getNextAgent(transferData.departmentId);
		} else {
			return RocketChat.Livechat.returnRoomAsInquiry(room._id, transferData.departmentId);
		}

		const { servedBy } = room;

		if (agent && agent.agentId !== servedBy._id) {
			RocketChat.models.Rooms.changeAgentByRoomId(room._id, agent);

			if (transferData.departmentId) {
				RocketChat.models.Rooms.changeDepartmentIdByRoomId(room._id, transferData.departmentId);
			}

			const subscriptionData = {
				rid: room._id,
				name: guest.name || guest.username,
				alert: true,
				open: true,
				unread: 1,
				userMentions: 1,
				groupMentions: 0,
				u: {
					_id: agent.agentId,
					username: agent.username,
				},
				t: 'l',
				desktopNotifications: 'all',
				mobilePushNotifications: 'all',
				emailNotifications: 'all',
			};
			RocketChat.models.Subscriptions.removeByRoomIdAndUserId(room._id, servedBy._id);

			RocketChat.models.Subscriptions.insert(subscriptionData);
			RocketChat.models.Rooms.incUsersCountById(room._id);

			RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(room._id, { _id: servedBy._id, username: servedBy.username });
			RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, { _id: agent.agentId, username: agent.username });

			const guestData = {
				token: guest.token,
				department: transferData.departmentId,
			};

			this.setDepartmentForGuest(guestData);
			const data = RocketChat.models.Users.getAgentInfo(agent.agentId);

			RocketChat.Livechat.stream.emit(room._id, {
				type: 'agentData',
				data,
			});

			return true;
		}

		return false;
	},

	returnRoomAsInquiry(rid, departmentId) {
		const room = RocketChat.models.Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:returnRoomAsInquiry' });
		}

		if (!room.servedBy) {
			return false;
		}

		const user = RocketChat.models.Users.findOne(room.servedBy._id);
		if (!user || !user._id) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:returnRoomAsInquiry' });
		}

		const agentIds = [];
		// get the agents of the department
		if (departmentId) {
			let agents = RocketChat.Livechat.getOnlineAgents(departmentId);

			if (agents.count() === 0 && RocketChat.settings.get('Livechat_guest_pool_with_no_agents')) {
				agents = RocketChat.Livechat.getAgents(departmentId);
			}

			if (agents.count() === 0) {
				return false;
			}

			agents.forEach((agent) => {
				agentIds.push(agent.agentId);
			});

			RocketChat.models.Rooms.changeDepartmentIdByRoomId(room._id, departmentId);
		}

		// delete agent and room subscription
		RocketChat.models.Subscriptions.removeByRoomId(rid);

		// remove agent from room
		RocketChat.models.Rooms.removeAgentByRoomId(rid);

		// find inquiry corresponding to room
		const inquiry = LivechatInquiry.findOne({ rid });
		if (!inquiry) {
			return false;
		}

		let openInq;
		// mark inquiry as open
		if (agentIds.length === 0) {
			openInq = LivechatInquiry.openInquiry(inquiry._id);
		} else {
			openInq = LivechatInquiry.openInquiryWithAgents(inquiry._id, agentIds);
		}

		if (openInq) {
			RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rid, { _id: room.servedBy._id, username: room.servedBy.username });

			RocketChat.Livechat.stream.emit(rid, {
				type: 'agentData',
				data: null,
			});
		}

		return openInq;
	},

	sendRequest(postData, callback, trying = 1) {
		try {
			const options = {
				headers: {
					'X-RocketChat-Livechat-Token': RocketChat.settings.get('Livechat_secret_token'),
				},
				data: postData,
			};
			return HTTP.post(RocketChat.settings.get('Livechat_webhookUrl'), options);
		} catch (e) {
			RocketChat.Livechat.logger.webhook.error(`Response error on ${ trying } try ->`, e);
			// try 10 times after 10 seconds each
			if (trying < 10) {
				RocketChat.Livechat.logger.webhook.warn('Will try again in 10 seconds ...');
				trying++;
				setTimeout(Meteor.bindEnvironment(() => {
					RocketChat.Livechat.sendRequest(postData, callback, trying);
				}), 10000);
			}
		}
	},

	getLivechatRoomGuestInfo(room) {
		const visitor = LivechatVisitors.findOneById(room.v._id);
		const agent = RocketChat.models.Users.findOneById(room.servedBy && room.servedBy._id);

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
				os: ua.getOS().name && (`${ ua.getOS().name } ${ ua.getOS().version }`),
				browser: ua.getBrowser().name && (`${ ua.getBrowser().name } ${ ua.getBrowser().version }`),
				customFields: visitor.livechatData,
			},
		};

		if (agent) {
			postData.agent = {
				_id: agent._id,
				username: agent.username,
				name: agent.name,
				email: null,
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

		const user = RocketChat.models.Users.findOneByUsername(username, { fields: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:addAgent' });
		}

		if (RocketChat.authz.addUserRoles(user._id, 'livechat-agent')) {
			RocketChat.models.Users.setOperator(user._id, true);
			RocketChat.models.Users.setLivechatStatus(user._id, 'available');
			return user;
		}

		return false;
	},

	addManager(username) {
		check(username, String);

		const user = RocketChat.models.Users.findOneByUsername(username, { fields: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:addManager' });
		}

		if (RocketChat.authz.addUserRoles(user._id, 'livechat-manager')) {
			return user;
		}

		return false;
	},

	removeAgent(username) {
		check(username, String);

		const user = RocketChat.models.Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:removeAgent' });
		}

		if (RocketChat.authz.removeUserFromRoles(user._id, 'livechat-agent')) {
			RocketChat.models.Users.setOperator(user._id, false);
			RocketChat.models.Users.setLivechatStatus(user._id, 'not-available');
			return true;
		}

		return false;
	},

	removeManager(username) {
		check(username, String);

		const user = RocketChat.models.Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:removeManager' });
		}

		return RocketChat.authz.removeUserFromRoles(user._id, 'livechat-manager');
	},

	removeGuest(_id) {
		check(_id, String);

		const guest = LivechatVisitors.findById(_id);
		if (!guest) {
			throw new Meteor.Error('error-invalid-guest', 'Invalid guest', { method: 'livechat:removeGuest' });
		}

		this.cleanGuestHistory(_id);
		return LivechatVisitors.removeById(_id);
	},

	cleanGuestHistory(_id) {
		const guest = LivechatVisitors.findById(_id);
		if (!guest) {
			throw new Meteor.Error('error-invalid-guest', 'Invalid guest', { method: 'livechat:cleanGuestHistory' });
		}

		const { token } = guest;

		RocketChat.models.Rooms.findByVisitorToken(token).forEach((room) => {
			RocketChat.models.Messages.removeFilesByRoomId(room._id);
			RocketChat.models.Messages.removeByRoomId(room._id);
		});

		RocketChat.models.Subscriptions.removeByVisitorToken(token);
		RocketChat.models.Rooms.removeByVisitorToken(token);
	},

	saveDepartment(_id, departmentData, departmentAgents) {
		check(_id, Match.Maybe(String));

		check(departmentData, {
			enabled: Boolean,
			name: String,
			description: Match.Optional(String),
			showOnRegistration: Boolean,
		});

		check(departmentAgents, [
			Match.ObjectIncluding({
				agentId: String,
				username: String,
			}),
		]);

		if (_id) {
			const department = LivechatDepartment.findOneById(_id);
			if (!department) {
				throw new Meteor.Error('error-department-not-found', 'Department not found', { method: 'livechat:saveDepartment' });
			}
		}

		return LivechatDepartment.createOrUpdateDepartment(_id, departmentData, departmentAgents);
	},

	removeDepartment(_id) {
		check(_id, String);

		const department = LivechatDepartment.findOneById(_id, { fields: { _id: 1 } });

		if (!department) {
			throw new Meteor.Error('department-not-found', 'Department not found', { method: 'livechat:removeDepartment' });
		}

		return LivechatDepartment.removeById(_id);
	},

	showConnecting() {
		if (RocketChat.settings.get('Livechat_Routing_Method') === 'Guest_Pool') {
			return RocketChat.settings.get('Livechat_open_inquiery_show_connecting');
		} else {
			return false;
		}
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

		const room = RocketChat.models.Rooms.findOneById(rid);

		const visitor = LivechatVisitors.getVisitorByToken(token);
		const userLanguage = (visitor && visitor.language) || RocketChat.settings.get('Language') || 'en';

		// allow to only user to send transcripts from their own chats
		if (!room || room.t !== 'l' || !room.v || room.v.token !== token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		const messages = RocketChat.models.Messages.findVisibleByRoomIdNotContainingTypes(rid, ['livechat_navigation_history'], { sort: { ts: 1 } });

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
			html = html + singleMessage;
		});

		html = `${ html }</div>`;

		let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = RocketChat.settings.get('From_Email');
		}

		const subject = TAPi18n.__('Transcript_of_your_livechat_conversation', { lng: userLanguage });

		this.sendEmail(fromEmail, email, fromEmail, subject, html);

		Meteor.defer(() => {
			RocketChat.callbacks.run('livechat.sendTranscript', messages, email);
		});

		return true;
	},

	notifyGuestStatusChanged(token, status) {
		LivechatInquiry.updateVisitorStatus(token, status);
		RocketChat.models.Rooms.updateVisitorStatus(token, status);
	},

	sendOfflineMessage(data = {}) {
		if (!RocketChat.settings.get('Livechat_display_offline_form')) {
			return false;
		}

		const message = (`${ data.message }`).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');

		const html = `
			<h1>New livechat message</h1>
			<p><strong>Visitor name:</strong> ${ data.name }</p>
			<p><strong>Visitor email:</strong> ${ data.email }</p>
			<p><strong>Message:</strong><br>${ message }</p>`;

		let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = RocketChat.settings.get('From_Email');
		}

		if (RocketChat.settings.get('Livechat_validate_offline_email')) {
			const emailDomain = data.email.substr(data.email.lastIndexOf('@') + 1);

			try {
				Meteor.wrapAsync(dns.resolveMx)(emailDomain);
			} catch (e) {
				throw new Meteor.Error('error-invalid-email-address', 'Invalid email address', { method: 'livechat:sendOfflineMessage' });
			}
		}

		const to = RocketChat.settings.get('Livechat_offline_email');
		const from = `${ data.name } - ${ data.email } <${ fromEmail }>`;
		const replyTo = `${ data.name } <${ data.email }>`;
		const subject = `Livechat offline message from ${ data.name }: ${ (`${ data.message }`).substring(0, 20) }`;

		this.sendEmail(from, to, replyTo, subject, html);

		Meteor.defer(() => {
			RocketChat.callbacks.run('livechat.offlineMessage', data);
		});

		return true;
	},

	notifyAgentStatusChanged(userId, status) {
		RocketChat.models.Rooms.findOpenByAgent(userId).forEach((room) => {
			RocketChat.Livechat.stream.emit(room._id, {
				type: 'agentStatus',
				status,
			});
		});
	},
};

RocketChat.Livechat.stream = new Meteor.Streamer('livechat-room');

RocketChat.Livechat.stream.allowRead((roomId, extraData) => {
	const room = RocketChat.models.Rooms.findOneById(roomId);

	if (!room) {
		console.warn(`Invalid eventName: "${ roomId }"`);
		return false;
	}

	if (room.t === 'l' && extraData && extraData.visitorToken && room.v.token === extraData.visitorToken) {
		return true;
	}
	return false;
});

RocketChat.settings.get('Livechat_history_monitor_type', (key, value) => {
	RocketChat.Livechat.historyMonitorType = value;
});
