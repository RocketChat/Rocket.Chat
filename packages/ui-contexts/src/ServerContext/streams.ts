import { ISetting as AppsSetting } from '@rocket.chat/apps-engine/definition/settings';
import type {
	IMessage,
	IRoom,
	ISetting,
	ISubscription,
	IRole,
	IEmoji,
	ICustomSound,
	INotificationDesktop,
	IWebdavAccount,
	VoipEventDataSignature,
	IUser,
	IOmnichannelRoom,
	VideoConference,
} from '@rocket.chat/core-typings';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface StreamerEvents {
	'roles': [{ key: 'roles'; args: [IRole] }];

	'notify-room': [
		{ key: `${string}/user-activity`; args: [username: string, activities: string] },
		{
			key: `${string}/deleteMessageBulk`;
			args: [args: { rid: IMessage['rid']; excludePinned: boolean; ignoreDiscussion: boolean; ts: Record<string, Date>; users: string[] }];
		},
		{ key: `${string}/deleteMessage`; args: [{ _id: IMessage['_id'] }] },
		{ key: `${string}/videoconf`; args: [id: string] },
		{ key: `${string}/e2e.keyRequest`; args: [unknown] },
	];

	'room-messages': [{ key: '__my_messages__'; args: [IMessage] }, { key: string; args: [IMessage] }];

	'notify-all': [
		{ key: 'deleteEmojiCustom'; args: [{ emojiData: IEmoji }] },
		{ key: 'updateCustomSound'; args: [{ soundData: ICustomSound }] },
		{ key: 'deleteCustomSound'; args: [{ soundData: ICustomSound }] },
		{ key: 'public-settings-changed'; args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting] },
		{ key: 'private-settings-changed'; args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting] },
	];

	'notify-user': [
		{ key: `${string}/rooms-changed`; args: [IRoom] },
		{ key: `${string}/subscriptions-changed`; args: [ISubscription] },
		{ key: `${string}/message`; args: [IMessage] },
		{ key: `${string}/force_logout`; args: [] },
		{
			key: `${string}/webdav`;
			args: [{ type: 'changed'; account: Partial<IWebdavAccount> } | { type: 'removed'; account: { _id: IWebdavAccount['_id'] } }];
		},
		{ key: `${string}/e2ekeyRequest`; args: [string, string] },
		{ key: `${string}/notification`; args: [INotificationDesktop] },
		{ key: `${string}/voip.events`; args: [VoipEventDataSignature] },
		{ key: `${string}/call.hangup`; args: [{ roomId: string }] },
		{ key: `${string}/uiInteraction`; args: [unknown] },
		{
			key: `${string}/video-conference`;
			args: [{ action: string; params: { callId: VideoConference['_id']; uid: IUser['_id']; rid: IRoom['_id'] } }];
		},
		{ key: `${string}/userData`; args: [unknown] },
		{ key: `${string}/updateInvites`; args: [unknown] },
		{ key: `${string}/departmentAgentData`; args: [unknown] },
	];

	'importers': [{ key: 'progress'; args: [{ rate: number; count: { completed: number; total: number } }] }];

	'notify-logged': [
		/* @deprecated */
		{ key: 'new-banner'; args: [{ bannerId: string }] },
		{ key: 'banner-changed'; args: [{ bannerId: string }] },
		{
			key: 'roles-change';
			args: [
				{
					type: 'added' | 'removed' | 'changed';
					_id: IRole['_id'];
					u: { _id: IUser['_id']; username: IUser['username']; name: IUser['name'] };
					scope?: IRoom['_id'];
				},
			];
		},
		{ key: 'Users:NameChanged'; args: [Pick<IUser, '_id' | 'name'>] },
		{ key: 'Users:Deleted'; args: [Pick<IUser, '_id'>] },
		{ key: 'voip.statuschanged'; args: [boolean] },
		{ key: 'omnichannel.priority-changed'; args: [{ id: 'added' | 'removed' | 'changed'; name: string }] },
		{ key: 'private-settings-changed'; args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting] },
		{ key: 'deleteCustomUserStatus'; args: [{ userStatusData: unknown }] },
		{ key: 'user-status'; args: [[IUser['_id'], IUser['username'], string, string, IUser['name'], IUser['roles']]] },
	];

	'stdout': [{ key: 'stdout'; args: [{ id: string; string: string; ts: Date }] }];

	'room-data': [{ key: string; args: [IOmnichannelRoom] }];

	'notify-room-users': [
		{
			key: `${string}/video-conference`;
			args: [{ action: string; params: { callId: VideoConference['_id']; uid: IUser['_id']; rid: IRoom['_id'] } }];
		},
		{ key: `${string}/webrtc`; args: unknown[] },
		{ key: `${string}/otr`; args: unknown[] },
		{ key: `${string}/userData`; args: unknown[] },
	];

	// 'notify-logged': (
	// 	e:
	// 		| 'private-settings-changed'
	// 		| 'permissions-changed'
	// 		| 'roles-change'
	// 		| 'deleteCustomUserStatus'
	// 		| 'updateCustomUserStatus'
	// 		| 'deleteEmojiCustom'
	// 		| 'updateEmojiCustom'
	// 		| 'updateAvatar'
	// 		| 'Users:Deleted',
	// ) => [void];

	'apps': [
		{ key: 'app/added'; args: [string] },
		{ key: 'app/removed'; args: [string] },
		{ key: 'app/updated'; args: [string] },
		{
			key: 'app/statusUpdate'; args: [{
				appId: string;
				status: 'auto_enabled' | 'auto_disabled' | 'manually_enabled' | 'manually_disabled';
		}] },
		{
			key: 'app/settingUpdate'; args: [{
				appId: string;
				setting: AppsSetting;
		}] },
		{ key: 'command/added'; args: [IAppCommand] },
		{ key: 'command/disabled'; args: [IAppCommand] },
		{ key: 'command/updated'; args: [IAppCommand] },
		{ key: 'command/removed'; args: [IAppCommand] },
		{ key: 'actions/changed'; args: [IAppAction] },
	]

	'livechat-room': [
		{
			key: string;
			args: [
				| {
						type: 'agentStatus';
						status: string;
				  }
				| {
						type: 'queueData' | 'agentData';
						data: {
							[k: string]: unknown;
						};
				  },
			];
		},
	];

	'user-presence': [{ key: string; args: [unknown] }];
}

export type StreamNames = keyof StreamerEvents;

export type StreamKeys<S extends StreamNames> = StreamerEvents[S][number]['key'];

export type StreamerConfigs<N extends StreamNames> = StreamerEvents[N][number];

export type StreamerConfig<N extends StreamNames, K extends StreamKeys<N>> = StreamerConfigs<N> extends infer U
	? U extends any
		? { key: K; args: any } extends U
			? U
			: never
		: never
	: never;

export type StreamerCallbackArgs<N extends StreamNames, K extends StreamKeys<N>> = StreamerConfig<N, K> extends {
	args: any;
}
	? StreamerConfig<N, K>['args']
	: never;
