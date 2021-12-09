import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { API } from '../../../../api/server';
import { VoipRoom } from '../../../../models/server/raw';
import { Voip } from '../../lib/Voip';
import { OmnichannelSourceType } from '../../../../../definition/IRoom';
import { logger } from '../../../../api/server/v1/voip/logger';

API.v1.addRoute('voip/room', {
	async get() {
		const defaultCheckParams = {
			token: String,
			rid: Match.Maybe(String),
			agentId: Match.Maybe(String),
		};
		check(this.queryParams, defaultCheckParams);

		const { token, rid: roomId, agentId } = this.queryParams;
		logger.error({ msg: 'voip/room AMOL_DEBUG_1', token, agentId, roomId });

		const guest = await Voip.getVisitorByToken(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		logger.error({ msg: 'voip/room AMOL_DEBUG_2', vid: guest.token });

		let room;
		if (!roomId) {
			room = await VoipRoom.findOneOpenByVisitorToken(token, {});
			logger.error({ msg: 'voip/room AMOL_DEBUG_3' });
			if (room) {
				return API.v1.success({ room, newRoom: false });
			}
			logger.error({ msg: 'voip/room AMOL_DEBUG_4' });
			let agent;
			const agentObj = agentId && Voip.findAgent(agentId);
			if (agentObj) {
				const { username } = agentObj;
				agent = { agentId, username };
			}
			logger.error({ msg: 'voip/room AMOL_DEBUG_5', agentId });
			const rid = Random.id();
			const roomInfo = {
				source: {
					type: OmnichannelSourceType.API,
				},
			};
			logger.error({ msg: 'voip/room AMOL_DEBUG_7' });
			room = await Voip.getNewRoom(guest, agent, rid, roomInfo);
			logger.error({ msg: 'voip/room AMOL_DEBUG_8', room });
			return API.v1.success(room);
		}
		logger.error({ msg: 'voip/room AMOL_DEBUG_9' });
		room = await VoipRoom.findOneOpenByRoomIdAndVisitorToken(roomId, token, {});
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}
		logger.error({ msg: 'voip/room AMOL_DEBUG_10', room });
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
			logger.error({ msg: 'voip/room.close AMOL_DEBUG_1' });
			const { rid, token } = this.bodyParams;

			const visitor = await Voip.getVisitorByToken(token);
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}
			logger.error({ msg: 'voip/room.close AMOL_DEBUG_2' });
			const room = await Voip.findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			if (!room.open) {
				throw new Meteor.Error('room-closed');
			}
			logger.error({ msg: 'voip/room.close AMOL_DEBUG_3' });
			const language = 'en';
			const comment = TAPi18n.__('Closed_by_visitor', { lng: language });

			if (!await Voip.closeRoom(visitor, room, /* comment*/ {})) {
				return API.v1.failure();
			}
			logger.error({ msg: 'voip/room.close AMOL_DEBUG_4' });
			return API.v1.success({ rid, comment });
		} catch (e) {
			logger.error({ msg: 'voip/room.close AMOL_DEBUG_5' });
			return API.v1.failure(e);
		}
	},
});
