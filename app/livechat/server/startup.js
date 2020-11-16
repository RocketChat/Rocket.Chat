import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { roomTypes } from '../../utils';
import { LivechatRooms } from '../../models';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { LivechatAgentActivityMonitor } from './statistics/LivechatAgentActivityMonitor';
import { businessHourManager } from './business-hour';
import { createDefaultBusinessHourIfNotExists } from './business-hour/Helper';
import { hasPermission } from '../../authorization/server';

import './roomAccessValidator.internalService';

Meteor.startup(async () => {
	roomTypes.setRoomFind('l', (_id) => LivechatRooms.findOneById(_id));

	callbacks.add('beforeLeaveRoom', function(user, room) {
		if (room.t !== 'l') {
			return user;
		}
		throw new Meteor.Error(TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
			lng: user.language || settings.get('Language') || 'en',
		}));
	}, callbacks.priority.LOW, 'cant-leave-room');

	callbacks.add('beforeJoinRoom', function(user, room) {
		if (room.t === 'l' && !hasPermission(user._id, 'view-l-room')) {
			throw new Meteor.Error('error-user-is-not-agent', 'User is not an Omnichannel Agent', { method: 'beforeJoinRoom' });
		}

		return user;
	}, callbacks.priority.LOW, 'cant-join-room');


	const monitor = new LivechatAgentActivityMonitor();

	let TroubleshootDisableLivechatActivityMonitor;
	settings.get('Troubleshoot_Disable_Livechat_Activity_Monitor', (key, value) => {
		if (TroubleshootDisableLivechatActivityMonitor === value) { return; }
		TroubleshootDisableLivechatActivityMonitor = value;

		if (value) {
			return monitor.stop();
		}

		monitor.start();
	});
	await createDefaultBusinessHourIfNotExists();

	settings.get('Livechat_enable_business_hours', async (key, value) => {
		if (value) {
			return businessHourManager.startManager();
		}
		return businessHourManager.stopManager();
	});
});
