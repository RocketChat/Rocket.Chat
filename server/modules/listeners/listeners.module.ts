import { IServiceClass } from '../../sdk/types/ServiceClass';
import { NotificationsModule } from '../notifications/notifications.module';
import { EnterpriseSettings, MeteorService } from '../../sdk/index';
import { IRoutingManagerConfig } from '../../../definition/IRoutingManagerConfig';

const STATUS_MAP: {[k: string]: number} = {
	offline: 0,
	online: 1,
	away: 2,
	busy: 3,
};

export const minimongoChangeMap: Record<string, string> = { inserted: 'added', updated: 'changed', removed: 'removed' };

export class ListenersModule {
	constructor(
		service: IServiceClass,
		notifications: NotificationsModule,
	) {
		service.onEvent('emoji.deleteCustom', (emoji) => {
			notifications.notifyLoggedInThisInstance('deleteEmojiCustom', {
				emojiData: emoji,
			});
		});

		service.onEvent('emoji.updateCustom', (emoji) => {
			notifications.notifyLoggedInThisInstance('updateEmojiCustom', {
				emojiData: emoji,
			});
		});

		service.onEvent('notify.ephemeralMessage', (uid, rid, message) => {
			notifications.notifyUserInThisInstance(uid, 'message', {
				groupable: false,
				...message,
				_id: String(Date.now()),
				rid,
				ts: new Date(),
			});
		});

		service.onEvent('permission.changed', ({ clientAction, data }) => {
			notifications.notifyLoggedInThisInstance('permissions-changed', clientAction, data);
		});

		service.onEvent('room.avatarUpdate', ({ _id: rid, avatarETag: etag }) => {
			notifications.notifyLoggedInThisInstance('updateAvatar', {
				rid,
				etag,
			});
		});

		service.onEvent('user.avatarUpdate', ({ username, avatarETag: etag }) => {
			notifications.notifyLoggedInThisInstance('updateAvatar', {
				username,
				etag,
			});
		});

		service.onEvent('user.deleted', ({ _id: userId }) => {
			notifications.notifyLoggedInThisInstance('Users:Deleted', {
				userId,
			});
		});

		service.onEvent('user.deleteCustomStatus', (userStatus) => {
			notifications.notifyLoggedInThisInstance('deleteCustomUserStatus', {
				userStatusData: userStatus,
			});
		});

		service.onEvent('user.nameChanged', (user) => {
			notifications.notifyLoggedInThisInstance('Users:NameChanged', user);
		});

		service.onEvent('user.roleUpdate', (update) => {
			notifications.notifyLoggedInThisInstance('roles-change', update);
		});

		service.onEvent('presence.status', ({ user }) => {
			const {
				_id, username, status, statusText,
			} = user;
			if (!status) {
				return;
			}

			notifications.notifyLoggedInThisInstance('user-status', [_id, username, STATUS_MAP[status], statusText]);
		});

		service.onEvent('user.updateCustomStatus', (userStatus) => {
			notifications.notifyLoggedInThisInstance('updateCustomUserStatus', {
				userStatusData: userStatus,
			});
		});

		service.onEvent('watch.messages', ({ message }) => {
			if (!message.rid) {
				return;
			}

			notifications.streamRoomMessage._emit('__my_messages__', [message], undefined, false, (streamer, _sub, eventName, args, allowed) => streamer.changedPayload(streamer.subscriptionName, 'id', {
				eventName,
				args: [args, allowed],
			}));

			notifications.streamRoomMessage.emitWithoutBroadcast(message.rid, message);
		});

		service.onEvent('watch.subscriptions', ({ clientAction, subscription }) => {
			if (!subscription.u?._id) {
				return;
			}

			// emit a removed event on msg stream to remove the user's stream-room-messages subscription when the user is removed from room
			if (clientAction === 'removed') {
				notifications.streamRoomMessage.__emit(subscription.u._id, clientAction, subscription);
			}

			notifications.streamUser.__emit(subscription.u._id, clientAction, subscription);

			notifications.notifyUserInThisInstance(
				subscription.u._id,
				'subscriptions-changed',
				clientAction,
				subscription,
			);
		});

		service.onEvent('watch.roles', ({ clientAction, role }): void => {
			const payload = {
				type: clientAction,
				...role,
			};
			notifications.streamRoles.emitWithoutBroadcast('roles', payload);
		});

		let autoAssignAgent: IRoutingManagerConfig | undefined;
		async function getRoutingManagerConfig(): Promise<IRoutingManagerConfig> {
			if (!autoAssignAgent) {
				autoAssignAgent = await MeteorService.getRoutingManagerConfig();
			}

			return autoAssignAgent;
		}

		service.onEvent('watch.inquiries', async ({ clientAction, inquiry, diff }): Promise<void> => {
			const config = await getRoutingManagerConfig();
			if (config.autoAssignAgent) {
				return;
			}

			const type = minimongoChangeMap[clientAction];
			if (clientAction === 'removed') {
				notifications.streamLivechatQueueData.emitWithoutBroadcast(inquiry._id, { _id: inquiry._id, clientAction });

				if (inquiry.department) {
					return notifications.streamLivechatQueueData.emitWithoutBroadcast(`department/${ inquiry.department }`, { type, ...inquiry });
				}

				return notifications.streamLivechatQueueData.emitWithoutBroadcast('public', { type, ...inquiry });
			}

			notifications.streamLivechatQueueData.emitWithoutBroadcast(inquiry._id, { ...inquiry, clientAction });

			if (!inquiry.department) {
				return notifications.streamLivechatQueueData.emitWithoutBroadcast('public', { type, ...inquiry });
			}

			notifications.streamLivechatQueueData.emitWithoutBroadcast(`department/${ inquiry.department }`, { type, ...inquiry });

			if (clientAction === 'updated' && !diff?.department) {
				notifications.streamLivechatQueueData.emitWithoutBroadcast('public', { type, ...inquiry });
			}
		});

		service.onEvent('watch.settings', async ({ clientAction, setting }): Promise<void> => {
			if (setting._id === 'Livechat_Routing_Method') {
				autoAssignAgent = undefined;
			}

			if (clientAction !== 'removed') {
				const result = await EnterpriseSettings.changeSettingValue(setting);
				if (result && !(result instanceof Error) && result.hasOwnProperty('value')) {
					setting.value = result.value;
				}
			}

			if (setting.hidden) {
				return;
			}

			const value = {
				_id: setting._id,
				value: setting.value,
				editor: setting.editor,
				properties: setting.properties,
				enterprise: setting.enterprise,
				requiredOnWizard: setting.requiredOnWizard,
			};

			if (setting.public === true) {
				notifications.notifyAllInThisInstance('public-settings-changed', clientAction, value);
			}

			notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, value);
		});

		service.onEvent('watch.rooms', ({ clientAction, room }): void => {
			// this emit will cause the user to receive a 'rooms-changed' event
			notifications.streamUser.__emit(room._id, clientAction, room);

			notifications.streamRoomData.emitWithoutBroadcast(room._id, room);
		});

		service.onEvent('watch.users', ({ clientAction, data, diff, unset, id }): void => {
			switch (clientAction) {
				case 'updated':
					notifications.notifyUserInThisInstance(id, 'userData', { diff, unset, type: clientAction });
					break;
				case 'inserted':
					notifications.notifyUserInThisInstance(id, 'userData', { data, type: clientAction });
					break;
				case 'removed':
					notifications.notifyUserInThisInstance(id, 'userData', { id, type: clientAction });
					break;
			}
		});

		service.onEvent('watch.integrationHistory', ({ clientAction, data, diff, id }): void => {
			if (!data?.integration?._id) {
				return;
			}
			switch (clientAction) {
				case 'updated': {
					notifications.streamIntegrationHistory.emitWithoutBroadcast(data.integration._id, { id, diff, type: clientAction });
					break;
				}
				case 'inserted': {
					notifications.streamIntegrationHistory.emitWithoutBroadcast(data.integration._id, { data, type: clientAction });
					break;
				}
			}
		});

		service.onEvent('watch.livechatDepartmentAgents', ({ clientAction, data }): void => {
			const { agentId } = data;
			if (!agentId) {
				return;
			}

			notifications.notifyUserInThisInstance(agentId, 'departmentAgentData', {
				action: clientAction,
				...data,
			});
		});
	}
}
