import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { ISetting as AppsSetting } from '@rocket.chat/apps-engine/definition/settings';
import type { IServiceClass } from '@rocket.chat/core-services';
import { EnterpriseSettings } from '@rocket.chat/core-services';
import { isSettingColor, isSettingEnterprise, UserStatus } from '@rocket.chat/core-typings';
import type { IUser, IRoom, IRole, VideoConference, ISetting, IOmnichannelRoom, IMessage, IOTRMessage } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { parse } from '@rocket.chat/message-parser';

import { settings } from '../../../app/settings/server/cached';
import type { NotificationsModule } from '../notifications/notifications.module';

const isMessageParserDisabled = process.env.DISABLE_MESSAGE_PARSER === 'true';

const STATUS_MAP: Record<UserStatus, 0 | 1 | 2 | 3> = {
	[UserStatus.OFFLINE]: 0,
	[UserStatus.ONLINE]: 1,
	[UserStatus.AWAY]: 2,
	[UserStatus.BUSY]: 3,
	[UserStatus.DISABLED]: 0,
} as const;

const minimongoChangeMap: Record<string, string> = {
	inserted: 'added',
	updated: 'changed',
	removed: 'removed',
} as const;

export class ListenersModule {
	constructor(service: IServiceClass, notifications: NotificationsModule) {
		const logger = new Logger('ListenersModule');

		service.onEvent('license.sync', () => notifications.notifyAllInThisInstance('license'));
		service.onEvent('license.actions', () => notifications.notifyAllInThisInstance('license'));

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

		service.onEvent('user.forceLogout', (uid) => {
			notifications.notifyUserInThisInstance(uid, 'force_logout');
		});

		service.onEvent('notify.ephemeralMessage', (uid, rid, message) => {
			if (!isMessageParserDisabled && message.msg) {
				const customDomains = settings.get<string>('Message_CustomDomain_AutoLink')
					? settings
							.get<string>('Message_CustomDomain_AutoLink')
							.split(',')
							.map((domain) => domain.trim())
					: [];

				message.md = parse(message.msg, {
					colors: settings.get('HexColorPreview_Enabled'),
					emoticons: true,
					customDomains,
					...(settings.get('Katex_Enabled') && {
						katex: {
							dollarSyntax: settings.get('Katex_Dollar_Syntax'),
							parenthesisSyntax: settings.get('Katex_Parenthesis_Syntax'),
						},
					}),
				});
			}

			notifications.notifyUserInThisInstance(uid, 'message', {
				groupable: false,
				u: {
					_id: 'rocket.cat',
					username: 'rocket.cat',
				},
				private: true,
				_id: message._id || String(Date.now()),
				rid,
				ts: new Date(),
				_updatedAt: new Date(),
				...message,
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

		service.onEvent('user.deleted', ({ _id: userId }, data) => {
			notifications.notifyLoggedInThisInstance('Users:Deleted', {
				userId,
				...data,
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

		service.onEvent(
			'user.video-conference',
			({
				userId,
				action,
				params,
			}: {
				userId: string;
				action: string;
				params: {
					callId: VideoConference['_id'];
					uid: IUser['_id'];
					rid: IRoom['_id'];
				};
			}) => {
				notifications.notifyUserInThisInstance(userId, 'video-conference', { action, params });
			},
		);

		service.onEvent('room.video-conference', ({ rid, callId }) => {
			/* deprecated */
			(notifications.notifyRoom as any)(rid, callId);

			notifications.notifyRoom(rid, 'videoconf', callId);
		});

		service.onEvent('presence.status', ({ user }) => {
			const { _id, username, name, status, statusText, roles } = user;
			if (!status || !username) {
				return;
			}

			notifications.notifyUserInThisInstance(_id, 'userData', {
				type: 'updated',
				id: _id,
				diff: {
					status,
					...(statusText && { statusText }),
				},
				unset: {},
			});

			notifications.notifyLoggedInThisInstance('user-status', [_id, username, STATUS_MAP[status], statusText, name, roles]);

			if (_id) {
				notifications.sendPresence(_id, username, STATUS_MAP[status], statusText);
			}
		});

		service.onEvent('user.updateCustomStatus', (userStatus) => {
			notifications.notifyLoggedInThisInstance('updateCustomUserStatus', {
				userStatusData: userStatus,
			});
		});

		service.onEvent('watch.messages', async ({ message }) => {
			if (!message.rid) {
				return;
			}

			notifications.streamRoomMessage._emit('__my_messages__', [message], undefined, false, (streamer, _sub, eventName, args, allowed) =>
				streamer.changedPayload(streamer.subscriptionName, 'id', {
					eventName,
					args: [...args, allowed],
				}),
			);

			notifications.streamRoomMessage.emitWithoutBroadcast(message.rid, message);
		});

		service.onEvent('notify.messagesRead', ({ rid, until, tmid }): void => {
			notifications.notifyRoomInThisInstance(rid, 'messagesRead', { tmid, until });
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

			notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', clientAction, subscription as any);
		});

		service.onEvent('watch.roles', ({ clientAction, role }): void => {
			notifications.streamRoles.emitWithoutBroadcast('roles', {
				type: clientAction,
				...(role as IRole),
			});
		});

		service.onEvent('watch.inquiries', async ({ clientAction, inquiry, diff }): Promise<void> => {
			const type = minimongoChangeMap[clientAction] as 'added' | 'changed' | 'removed';

			const isOnlyQueueMetadataUpdate = (diff: Record<string, unknown> | undefined): boolean => {
				if (!diff) {
					return false;
				}

				const queueMetadataKeys = ['lockedAt', 'locked', '_updatedAt'];
				return Object.keys(diff).length === queueMetadataKeys.length && queueMetadataKeys.every((key) => diff.hasOwnProperty(key));
			};

			// Always notify the specific inquiry channel
			notifications.streamLivechatQueueData.emitWithoutBroadcast(inquiry._id, {
				_id: inquiry._id,
				...(clientAction !== 'removed' && { ...inquiry }),
				clientAction,
			});

			// Skip further notifications if it's just a queue metadata update
			if (clientAction === 'updated' && isOnlyQueueMetadataUpdate(diff)) {
				return;
			}

			// Notify the defaultAgent if exists
			if (inquiry.defaultAgent?.agentId) {
				notifications.streamLivechatQueueData.emitWithoutBroadcast(`agent/${inquiry.defaultAgent.agentId}`, {
					type,
					...inquiry,
				});
			}

			// Prioritize department-specific channel over public
			if (inquiry.department) {
				notifications.streamLivechatQueueData.emitWithoutBroadcast(`department/${inquiry.department}`, {
					type,
					...inquiry,
				});
			}

			if (!inquiry.department && !inquiry.defaultAgent?.agentId) {
				notifications.streamLivechatQueueData.emitWithoutBroadcast('public', {
					type,
					...inquiry,
				});
			}
		});

		service.onEvent('watch.settings', async ({ clientAction, setting }): Promise<void> => {
			// if a EE setting changed make sure we broadcast the correct value according to license
			if (clientAction !== 'removed' && isSettingEnterprise(setting)) {
				try {
					const result = await EnterpriseSettings.changeSettingValue(setting);
					if (result !== undefined && !(result instanceof Error)) {
						setting.value = result;
					}
				} catch (err: unknown) {
					logger.error({ msg: 'Error getting proper enterprise setting value. Returning `invalidValue` instead.', err });
					setting.value = setting.invalidValue;
				}
			}

			if (setting.hidden) {
				return;
			}

			const value = {
				_id: setting._id,
				value: setting.value,
				...(isSettingColor(setting) && { editor: setting.editor }),
				properties: setting.properties,
				enterprise: setting.enterprise,
				requiredOnWizard: setting.requiredOnWizard,
			} as ISetting;

			if (setting.public === true) {
				notifications.notifyAllInThisInstance('public-settings-changed', clientAction, value);
				notifications.notifyAllInThisInstance('public-info', ['public-settings-changed', [clientAction, value]]);
			}

			notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, value);
		});

		service.onEvent('watch.rooms', ({ clientAction, room }): void => {
			// this emit will cause the user to receive a 'rooms-changed' event
			notifications.streamUser.__emit(room._id, clientAction, room);

			notifications.streamRoomData.emitWithoutBroadcast(room._id, room as IOmnichannelRoom);
		});

		service.onEvent('watch.users', (event): void => {
			switch (event.clientAction) {
				case 'updated':
					notifications.notifyUserInThisInstance(event.id, 'userData', {
						id: event.id,
						diff: event.diff,
						unset: event.unset,
						type: 'updated',
					});
					break;
				case 'inserted':
					notifications.notifyUserInThisInstance(event.id, 'userData', { id: event.id, data: event.data, type: 'inserted' });
					break;
				case 'removed':
					notifications.notifyUserInThisInstance(event.id, 'userData', { id: event.id, type: 'removed' });
					break;
			}
		});

		service.onEvent('watch.integrationHistory', ({ clientAction, data, diff, id }): void => {
			if (!data?.integration?._id) {
				return;
			}
			switch (clientAction) {
				case 'updated': {
					notifications.streamIntegrationHistory.emitWithoutBroadcast(data.integration._id, {
						id,
						diff,
						type: clientAction,
					});
					break;
				}
				case 'inserted': {
					notifications.streamIntegrationHistory.emitWithoutBroadcast(data.integration._id, {
						data,
						type: clientAction,
					});
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

		service.onEvent('banner.user', (userId, banner): void => {
			notifications.notifyUserInThisInstance(userId, 'banners', banner);
		});

		service.onEvent('banner.new', (bannerId): void => {
			notifications.notifyLoggedInThisInstance('new-banner', { bannerId }); // deprecated
			notifications.notifyLoggedInThisInstance('banner-changed', { bannerId });
		});

		service.onEvent('banner.disabled', (bannerId): void => {
			notifications.notifyLoggedInThisInstance('banner-changed', { bannerId });
		});

		service.onEvent('banner.enabled', (bannerId): void => {
			notifications.notifyLoggedInThisInstance('banner-changed', { bannerId });
		});

		service.onEvent('voip.events', (userId, data): void => {
			notifications.notifyUserInThisInstance(userId, 'voip.events', data);
		});

		service.onEvent('call.callerhangup', (userId, data): void => {
			notifications.notifyUserInThisInstance(userId, 'call.hangup', data);
		});

		service.onEvent('notify.desktop', (uid, notification): void => {
			notifications.notifyUserInThisInstance(uid, 'notification', notification);
		});

		service.onEvent('notify.uiInteraction', (uid, interaction): void => {
			notifications.notifyUserInThisInstance(uid, 'uiInteraction', interaction);
		});

		service.onEvent('notify.updateInvites', (uid, data): void => {
			notifications.notifyUserInThisInstance(uid, 'updateInvites', data);
		});

		service.onEvent('notify.webdav', (uid, data): void => {
			notifications.notifyUserInThisInstance(uid, 'webdav', data);
		});

		service.onEvent('notify.e2e.keyRequest', (rid, data): void => {
			notifications.notifyRoomInThisInstance(rid, 'e2e.keyRequest', data);
		});

		service.onEvent('notify.deleteMessage', (rid, data): void => {
			notifications.notifyRoomInThisInstance(rid, 'deleteMessage', data);
		});

		service.onEvent('notify.deleteMessageBulk', (rid, data): void => {
			notifications.notifyRoomInThisInstance(rid, 'deleteMessageBulk', data);
		});

		service.onEvent('notify.deleteCustomSound', (data): void => {
			notifications.notifyAllInThisInstance('deleteCustomSound', data);
			notifications.notifyAllInThisInstance('public-info', ['deleteCustomSound', [data]]);
		});

		service.onEvent('notify.updateCustomSound', (data): void => {
			notifications.notifyAllInThisInstance('updateCustomSound', data);
			notifications.notifyAllInThisInstance('public-info', ['updateCustomSound', [data]]);
		});

		service.onEvent('notify.calendar', (uid, data): void => {
			notifications.notifyUserInThisInstance(uid, 'calendar', data);
		});

		service.onEvent('notify.importedMessages', ({ roomIds }): void => {
			roomIds.forEach((rid) => {
				// couldnt get TS happy by providing no data, so had to provide null
				notifications.notifyRoomInThisInstance(rid, 'messagesImported', null);
			});
		});

		service.onEvent('connector.statuschanged', (enabled): void => {
			notifications.notifyLoggedInThisInstance('voip.statuschanged', enabled);
		});
		service.onEvent('omnichannel.room', (roomId, data): void => {
			notifications.streamLivechatRoom.emitWithoutBroadcast(roomId, data);
		});
		service.onEvent('watch.priorities', async ({ clientAction, diff, id }): Promise<void> => {
			notifications.notifyLoggedInThisInstance('omnichannel.priority-changed', { id, clientAction, name: diff?.name });
		});

		service.onEvent('apps.added', (appId: string) => {
			notifications.streamApps.emitWithoutBroadcast('app/added', appId);
			notifications.streamApps.emitWithoutBroadcast('apps', ['app/added', [appId]]);
		});

		service.onEvent('apps.removed', (appId: string) => {
			notifications.streamApps.emitWithoutBroadcast('app/removed', appId);
			notifications.streamApps.emitWithoutBroadcast('apps', ['app/removed', [appId]]);
		});

		service.onEvent('apps.updated', (appId: string) => {
			notifications.streamApps.emitWithoutBroadcast('app/updated', appId);
			notifications.streamApps.emitWithoutBroadcast('apps', ['app/updated', [appId]]);
		});

		service.onEvent('apps.statusUpdate', (appId: string, status: AppStatus) => {
			notifications.streamApps.emitWithoutBroadcast('app/statusUpdate', { appId, status });
			notifications.streamApps.emitWithoutBroadcast('apps', ['app/statusUpdate', [{ appId, status }]]);
		});

		service.onEvent('apps.settingUpdated', (appId: string, setting: AppsSetting) => {
			notifications.streamApps.emitWithoutBroadcast('app/settingUpdated', { appId, setting });
			notifications.streamApps.emitWithoutBroadcast('apps', ['app/settingUpdated', [{ appId, setting }]]);
		});

		service.onEvent('command.added', (command: string) => {
			notifications.streamApps.emitWithoutBroadcast('command/added', command);
			notifications.streamApps.emitWithoutBroadcast('apps', ['command/added', [command]]);
		});

		service.onEvent('command.disabled', (command: string) => {
			notifications.streamApps.emitWithoutBroadcast('command/disabled', command);
			notifications.streamApps.emitWithoutBroadcast('apps', ['command/disabled', [command]]);
		});

		service.onEvent('command.updated', (command: string) => {
			notifications.streamApps.emitWithoutBroadcast('command/updated', command);
			notifications.streamApps.emitWithoutBroadcast('apps', ['command/updated', [command]]);
		});

		service.onEvent('command.removed', (command: string) => {
			notifications.streamApps.emitWithoutBroadcast('command/removed', command);
			notifications.streamApps.emitWithoutBroadcast('apps', ['command/removed', [command]]);
		});

		service.onEvent('actions.changed', () => {
			notifications.streamApps.emitWithoutBroadcast('actions/changed');
			notifications.streamApps.emitWithoutBroadcast('apps', ['actions/changed', []]);
		});

		service.onEvent('otrMessage', ({ roomId, message, user, room }: { roomId: string; message: IMessage; user: IUser; room: IRoom }) => {
			notifications.streamRoomMessage.emit(roomId, message, user, room);
		});
		service.onEvent('otrAckUpdate', ({ roomId, acknowledgeMessage }: { roomId: string; acknowledgeMessage: IOTRMessage }) => {
			notifications.streamRoomMessage.emit(roomId, acknowledgeMessage);
		});
	}
}
