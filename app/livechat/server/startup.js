import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { roomTypes } from '../../utils';
import { LivechatRooms } from '../../models';
import { hasPermission, hasRole, addRoomAccessValidator } from '../../authorization';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { LivechatInquiry } from '../lib/LivechatInquiry';
import { LivechatDepartment, LivechatDepartmentAgents } from '../../models/server';
import { RoutingManager } from './lib/RoutingManager';
import { createLivechatQueueView } from './lib/Helper';
import { LivechatSessionsMonitor } from './statistics/LivechatSessionsMonitor';

Meteor.startup(() => {
	roomTypes.setRoomFind('l', (_id) => LivechatRooms.findOneById(_id));

	addRoomAccessValidator(function(room, user) {
		return room && room.t === 'l' && user && hasPermission(user._id, 'view-livechat-rooms');
	});

	addRoomAccessValidator(function(room, user) {
		if (!room || !user || room.t !== 'l') {
			return;
		}
		const { _id: userId } = user;
		const { servedBy: { _id: agentId } = {} } = room;
		return userId === agentId;
	});

	addRoomAccessValidator(function(room, user, extraData) {
		if (!room && extraData && extraData.rid) {
			room = LivechatRooms.findOneById(extraData.rid);
		}
		return room && room.t === 'l' && extraData && extraData.visitorToken && room.v && room.v.token === extraData.visitorToken;
	});

	addRoomAccessValidator(function(room, user) {
		const { previewRoom } = RoutingManager.getConfig();
		if (!previewRoom) {
			return;
		}

		if (!user || !room || room.t !== 'l') {
			return;
		}

		let departmentIds;
		if (!hasRole(user._id, 'livechat-manager')) {
			const departmentAgents = LivechatDepartmentAgents.findByAgentId(user._id).fetch().map((d) => d.departmentId);
			departmentIds = LivechatDepartment.find({ _id: { $in: departmentAgents }, enabled: true }).fetch().map((d) => d._id);
		}

		const filter = {
			rid: room._id,
			...departmentIds && departmentIds.length > 0 && { department: { $in: departmentIds } },
		};

		const inquiry = LivechatInquiry.findOne(filter, { fields: { status: 1 } });
		return inquiry && inquiry.status === 'queued';
	});

	callbacks.add('beforeLeaveRoom', function(user, room) {
		if (room.t !== 'l') {
			return user;
		}
		throw new Meteor.Error(TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
			lng: user.language || settings.get('Language') || 'en',
		}));
	}, callbacks.priority.LOW, 'cant-leave-room');

	createLivechatQueueView();

	new LivechatSessionsMonitor().start();
});
