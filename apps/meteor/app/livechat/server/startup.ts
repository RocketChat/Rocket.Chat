import type { IUser } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatRooms } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { beforeLeaveRoomCallback } from '../../../lib/callbacks/beforeLeaveRoomCallback';
import { i18n } from '../../../server/lib/i18n';
import { roomCoordinator } from '../../../server/lib/rooms/roomCoordinator';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { settings } from '../../settings/server';
import { businessHourManager } from './business-hour';
import { createDefaultBusinessHourIfNotExists } from './business-hour/Helper';
import { Livechat as LivechatTyped } from './lib/LivechatTyped';
import { RoutingManager } from './lib/RoutingManager';
import { LivechatAgentActivityMonitor } from './statistics/LivechatAgentActivityMonitor';
import './roomAccessValidator.internalService';

const logger = new Logger('LivechatStartup');

Meteor.startup(async () => {
	roomCoordinator.setRoomFind('l', (_id) => LivechatRooms.findOneById(_id));

	beforeLeaveRoomCallback.add(
		(user, room) => {
			if (!isOmnichannelRoom(room)) {
				return;
			}
			throw new Meteor.Error(
				i18n.t('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
					lng: user.language || settings.get('Language') || 'en',
				}),
			);
		},
		callbacks.priority.LOW,
		'cant-leave-omnichannel-room',
	);

	callbacks.add(
		'beforeJoinRoom',
		async (user, room) => {
			if (isOmnichannelRoom(room) && !(await hasPermissionAsync(user._id, 'view-l-room'))) {
				throw new Meteor.Error('error-user-is-not-agent', 'User is not an Omnichannel Agent', {
					method: 'beforeJoinRoom',
				});
			}

			return user;
		},
		callbacks.priority.LOW,
		'cant-join-omnichannel-room',
	);

	const monitor = new LivechatAgentActivityMonitor();

	settings.watch<boolean>('Troubleshoot_Disable_Livechat_Activity_Monitor', async (value) => {
		if (value) {
			return monitor.stop();
		}

		await monitor.start();
	});
	await createDefaultBusinessHourIfNotExists();

	settings.watch<boolean>('Livechat_enable_business_hours', async (value) => {
		logger.debug(`Starting business hour manager ${value}`);
		if (value) {
			await businessHourManager.startManager();
			return;
		}
		await businessHourManager.stopManager();
	});

	settings.watch<string>('Livechat_Routing_Method', () => {
		void RoutingManager.startQueue();
	});

	// Remove when accounts.onLogout is async
	Accounts.onLogout(
		({ user }: { user: IUser }) =>
			user?.roles?.includes('livechat-agent') &&
			!user?.roles?.includes('bot') &&
			void LivechatTyped.setUserStatusLivechatIf(
				user._id,
				ILivechatAgentStatus.NOT_AVAILABLE,
				{},
				{ livechatStatusSystemModified: true },
			).catch(),
	);
});
