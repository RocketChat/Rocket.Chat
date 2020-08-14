import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { findGuest, settings, online, findOpenRoom, getExtraConfigInfo, findAgent } from '../lib/livechat';
import { LivechatRooms } from '../../../../models';


API.v1.addRoute('livechat/config', {
	get() {
		try {
			check(this.queryParams, {
				token: Match.Maybe(String),
				department: Match.Maybe(String),
				roomId: Match.Maybe(String),
			});

			const config = settings();
			if (!config.enabled) {
				return API.v1.success({ config: { enabled: false } });
			}

			let { token } = this.queryParams;
			const { department, roomId } = this.queryParams;
			const status = online(department);

			let room;
			room = roomId && Promise.await(LivechatRooms.findOneById(roomId));

			if (room) {
				token = room.v && room.v.token;
			}

			const guest = token && findGuest(token);

			if (guest && !room) {
				room = findOpenRoom(token);
			}

			const agent = room && room.servedBy && findAgent(room.servedBy._id);

			const extra = Promise.await(getExtraConfigInfo(room));
			const { config: extraConfig = {} } = extra || {};
			Object.assign(config, { online: status, guest, room, agent }, { ...extraConfig });

			return API.v1.success({ config });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
