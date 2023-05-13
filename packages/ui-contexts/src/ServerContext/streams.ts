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
		{ key: `${string}/typing`; args: [username: string, activities: string] },
		{
			key: `${string}/deleteMessageBulk`;
			args: [args: { rid: IMessage['rid']; excludePinned: boolean; ignoreDiscussion: boolean; ts: Record<string, Date>; users: string[] }];
		},
		{ key: `${string}/deleteMessage`; args: [{ _id: IMessage['_id'] }] },
		{ key: `${string}/videoconf`; args: [id: string] },
	];

	'room-messages': [{ key: string; args: [IMessage] }];

	'notify-all': [
		{ key: 'deleteEmojiCustom'; args: [{ emojiData: IEmoji }] },
		{ key: 'updateCustomSound'; args: [{ soundData: ICustomSound }] },
		{ key: 'updateEmojiCustom'; args: [{ emojiData: IEmoji }] },
		{ key: 'public-settings-changed'; args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting] },
		{ key: 'permissions-changed'; args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting] },
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

		{ key: `${string}/otr`; args: [unknown] },
		{ key: `${string}/webrtc`; args: [unknown] },
	];

	'importers': [{ key: 'progress'; args: [{ rate: number; count: { completed: number; total: number } }] }];

	'notify-logged': [
		// { key: 'roles-change'; args: [IRole] },
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
		{
			key: 'Users:Deleted';
			args: [
				{
					userId: IUser['_id'];
				},
			];
		},
		{ key: 'updateAvatar'; args: [{ username: IUser['username']; avatarETag: IUser['avatarETag'] }] },
		{ key: 'voip.statuschanged'; args: [boolean] },
		{ key: 'omnichannel.priority-changed'; args: [{ id: 'added' | 'removed' | 'changed'; name: string }] },
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

	// 'apps': (
	// 	e:
	// 		| 'app/added'
	// 		| 'app/removed'
	// 		| 'app/updated'
	// 		| 'app/statusUpdate'
	// 		| 'app/settingUpdate'
	// 		| 'command/added'
	// 		| 'command/disabled'
	// 		| 'command/updated'
	// 		| 'command/removed'
	// 		| 'actions/changed',
	// ) => [unknown];
	// 'user-presence': () => [void];

	'livechat-room': [
		{
			key: string;
			args: [
				| {
						type: 'agentData';
						data: unknown;
				  }
				| {
						type: 'agentStatus';
						status: unknown;
				  }
				| {
						type: 'queueData';
						data: unknown;
				  }
				| {
						type: 'visitorData';
						visitor: unknown;
				  },
			];
		},
	];
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
