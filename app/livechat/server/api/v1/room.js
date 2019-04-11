import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { settings as rcSettings } from '../../../../settings';
import { Messages, Rooms } from '../../../../models';
import { API } from '../../../../api';
import { findGuest, findRoom, getRoom, settings, findAgent } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/room', {
	get() {
		try {
			check(this.queryParams, {
				token: String,
				rid: Match.Maybe(String),
				agentId: Match.Maybe(String),
			});

			const { token } = this.queryParams;
			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			let agent;
			const { agentId } = this.queryParams;
			const agentObj = agentId && findAgent(agentId);
			if (agentObj) {
				const { username } = agentObj;
				Object.assign(agent, { agentId, username });
			}

			const rid = this.queryParams.rid || Random.id();
			const room = getRoom({ guest, rid, agent });

			return API.v1.success(room);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/room.close', {
	post() {
		try {
			check(this.bodyParams, {
				rid: String,
				token: String,
			});

			const { rid, token } = this.bodyParams;

			const visitor = findGuest(token);
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			if (!room.open) {
				throw new Meteor.Error('room-closed');
			}

			const language = rcSettings.get('Language') || 'en';
			const comment = TAPi18n.__('Closed_by_visitor', { lng: language });

			if (!Livechat.closeRoom({ visitor, room, comment })) {
				return API.v1.failure();
			}

			return API.v1.success({ rid, comment });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/room.transfer', {
	post() {
		try {
			check(this.bodyParams, {
				rid: String,
				token: String,
				department: String,
			});

			const { rid, token, department } = this.bodyParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			let room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			// update visited page history to not expire
			Messages.keepHistoryForToken(token);

			if (!Livechat.transfer(room, guest, { roomId: rid, departmentId: department })) {
				return API.v1.failure();
			}

			room = findRoom(token, rid);
			return API.v1.success({ room });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/room.survey', {
	post() {
		try {
			check(this.bodyParams, {
				rid: String,
				token: String,
				data: [Match.ObjectIncluding({
					name: String,
					value: String,
				})],
			});

			const { rid, token, data } = this.bodyParams;

			const visitor = findGuest(token);
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const config = settings();
			if (!config.survey || !config.survey.items || !config.survey.values) {
				throw new Meteor.Error('invalid-livechat-config');
			}

			const updateData = {};
			for (const item of data) {
				if ((config.survey.items.includes(item.name) && config.survey.values.includes(item.value)) || item.name === 'additionalFeedback') {
					updateData[item.name] = item.value;
				}
			}

			if (Object.keys(updateData).length === 0) {
				throw new Meteor.Error('invalid-data');
			}

			if (!Rooms.updateSurveyFeedbackById(room._id, updateData)) {
				return API.v1.failure();
			}

			return API.v1.success({ rid, data: updateData });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/room.forward', { authRequired: true }, {
	post() {
		API.v1.success(Meteor.runAsUser(this.userId, () => Meteor.call('livechat:transfer', this.bodyParams)));
	},
});
