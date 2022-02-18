import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { roomTypes } from '../../utils';
import { LivechatRooms, LivechatInquiry } from '../../models/server';
import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';
import { LivechatAgentActivityMonitor } from './statistics/LivechatAgentActivityMonitor';
import { businessHourManager } from './business-hour';
import { createDefaultBusinessHourIfNotExists } from './business-hour/Helper';
import { hasPermission } from '../../authorization/server';
import { Livechat } from './lib/Livechat';
import { RoutingManager } from './lib/RoutingManager';

import './roomAccessValidator.internalService';

Meteor.startup(async () => {
	roomTypes.setRoomFind('l', (_id) => LivechatRooms.findOneById(_id));

	callbacks.add(
		'beforeLeaveRoom',
		function (user, room) {
			if (room.t !== 'l') {
				return user;
			}
			throw new Meteor.Error(
				TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
					lng: user.language || settings.get('Language') || 'en',
				}),
			);
		},
		callbacks.priority.LOW,
		'cant-leave-room',
	);

	callbacks.add(
		'beforeJoinRoom',
		function (user, room) {
			console.log('beforeJoinRoom', user, room);
			if (room.t === 'l' && !hasPermission(user._id, 'view-l-room')) {
				throw new Meteor.Error('error-user-is-not-agent', 'User is not an Omnichannel Agent', {
					method: 'beforeJoinRoom',
				});
			}

			return user;
		},
		callbacks.priority.LOW,
		'cant-join-room',
	);

	callbacks.add(
		'beforeJoinRoom',
		function (user, room) {
			console.log('beforeJoinRoom', user, room);
			if (room.t === 'l' && !room.servedBy) {
				const inquiry = LivechatInquiry.findOneByRoomId(room._id);
				if (!inquiry) {
					throw new Meteor.Error('error-invalid-inquiry', `Error: No inquiry found connected to room with id: ${room._id}`);
				}
				console.log('beforeJoinRoom', inquiry);
				Meteor.runAsUser(user._id, () => Meteor.call('livechat:takeInquiry', inquiry._id));
			}

			return user;
		},
		callbacks.priority.HIGH,
		'auto-assign-managers-to-livechat-rooms-if-no-one-is-assigned-to-chat',
	);

	const monitor = new LivechatAgentActivityMonitor();

	let TroubleshootDisableLivechatActivityMonitor;
	settings.watch('Troubleshoot_Disable_Livechat_Activity_Monitor', (value) => {
		if (TroubleshootDisableLivechatActivityMonitor === value) {
			return;
		}
		TroubleshootDisableLivechatActivityMonitor = value;

		if (value) {
			return monitor.stop();
		}

		monitor.start();
	});
	await createDefaultBusinessHourIfNotExists();

	settings.watch('Livechat_enable_business_hours', async (value) => {
		if (value) {
			return businessHourManager.startManager();
		}
		return businessHourManager.stopManager();
	});

	settings.watch('Livechat_Routing_Method', function (value) {
		RoutingManager.setMethodNameAndStartQueue(value);
	});

	Accounts.onLogout(
		({ user }) =>
			user?.roles?.includes('livechat-agent') &&
			!user?.roles?.includes('bot') &&
			Livechat.setUserStatusLivechatIf(user._id, 'not-available', {}, { livechatStatusSystemModified: true }),
	);
});
