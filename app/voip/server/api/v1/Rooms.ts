import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { API } from '../../../../api/server';
import { VoipRoom, LivechatVisitors } from '../../../../models/server/raw';
import { LivechatVoip } from '../../../../../server/sdk';
import { IVoipRoom, OmnichannelSourceType } from '../../../../../definition/IRoom';

API.v1.addRoute('voip/room', {
	async get() {
		const defaultCheckParams = {
			token: String,
			rid: Match.Maybe(String),
			agentId: Match.Maybe(String),
		};
		check(this.queryParams, defaultCheckParams);

		const { token, rid: roomId, agentId } = this.queryParams;
		const guest = await LivechatVisitors.getVisitorByToken(token, {});
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		let room;
		if (!roomId) {
			room = await VoipRoom.findOneOpenByVisitorToken(token, {});
			if (room) {
				return API.v1.success({ room, newRoom: false });
			}
			let agent;

			let agentObj = null;
			if (agentId) {
				agentObj = await LivechatVoip.findAgent(agentId);
			}
			if (agentObj) {
				const { username } = agentObj;
				agent = { agentId, username };
			}
			const rid = Random.id();
			const roomInfo = {
				source: {
					type: OmnichannelSourceType.API,
				},
			};
			room = await LivechatVoip.getNewRoom(guest, agent, rid, roomInfo);
			return API.v1.success({ room: room.result });
		}
		room = await VoipRoom.findOneOpenByRoomIdAndVisitorToken(roomId, token, {});
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}
		return API.v1.success({ room, newRoom: false });
	},
});
API.v1.addRoute('voip/room.close', {
	async post() {
		try {
			check(this.bodyParams, {
				rid: String,
				token: String,
			});
			const { rid, token } = this.bodyParams;

			const visitor = await LivechatVisitors.getVisitorByToken(token, {});
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}
			const roomResult = await LivechatVoip.findRoom(token, rid);
			if (!roomResult.result) {
				throw new Meteor.Error('invalid-room');
			}
			const room: IVoipRoom = roomResult.result as IVoipRoom;
			if (!room.open) {
				throw new Meteor.Error('room-closed');
			}
			const language = 'en';
			const comment = TAPi18n.__('Closed_by_visitor', { lng: language });
			const closeResult = await LivechatVoip.closeRoom(visitor, room, {});
			if (!closeResult.result) {
				return API.v1.failure();
			}
			return API.v1.success({ rid, comment });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
