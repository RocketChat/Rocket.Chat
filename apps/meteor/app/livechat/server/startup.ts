import type { IUser } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatRooms } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { businessHourManager } from './business-hour';
import { createDefaultBusinessHourIfNotExists } from './business-hour/Helper';
import { setUserStatusLivechatIf } from './lib/utils';
import { LivechatAgentActivityMonitor } from './statistics/LivechatAgentActivityMonitor';
import { callbacks } from '../../../lib/callbacks';
import { beforeLeaveRoomCallback } from '../../../lib/callbacks/beforeLeaveRoomCallback';
import { i18n } from '../../../server/lib/i18n';
import { roomCoordinator } from '../../../server/lib/rooms/roomCoordinator';
import { maybeMigrateLivechatRoom } from '../../api/server/lib/maybeMigrateLivechatRoom';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { notifyOnUserChange } from '../../lib/server/lib/notifyListener';
import { settings } from '../../settings/server';
import './roomAccessValidator.internalService';

const logger = new Logger('LivechatStartup');

Meteor.startup(async () => {
	roomCoordinator.setRoomFind('l', async (id) => maybeMigrateLivechatRoom(await LivechatRooms.findOneById(id)));

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

	settings.watch<boolean>(
		'Livechat_enable_business_hours',
		async (value) => {
			logger.debug(`Starting business hour manager ${value}`);
			if (value) {
				await businessHourManager.startManager();
				return;
			}
			await businessHourManager.stopManager();
		},
		process.env.TEST_MODE === 'true'
			? {
					debounce: 10,
				}
			: undefined,
	);

	// Remove when accounts.onLogout is async
	Accounts.onLogout(({ user }: { user?: IUser }) => {
		if (!user?.roles?.includes('livechat-agent') || user?.roles?.includes('bot')) {
			return;
		}

		void setUserStatusLivechatIf(user._id, ILivechatAgentStatus.NOT_AVAILABLE, {}, { livechatStatusSystemModified: true }).catch();

		// TODO: Shouldn't this notifier be the same as the one inside setUserStatusLivechatIf?
		void notifyOnUserChange({
			id: user._id,
			clientAction: 'updated',
			diff: {
				statusLivechat: ILivechatAgentStatus.NOT_AVAILABLE,
				livechatStatusSystemModified: true,
			},
		});
	});
});
