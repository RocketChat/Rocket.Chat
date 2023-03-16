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
	// IEmoji,
	// ICustomSound,
	IOmnichannelRoom,
} from '@rocket.chat/core-typings';

type StreamerKeyArgs<K, T extends unknown[]> = (key: K, cb: (...args: T) => void) => () => void;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface StreamerEvents {
	'roles': StreamerKeyArgs<'roles', [IRole]>;

	'notify-room': StreamerKeyArgs<`${string}/user-activity`, [username: string, activities: string]> &
		StreamerKeyArgs<
			`${string}/deleteMessageBulk`,
			[args: { rid: IMessage['rid']; excludePinned: boolean; ignoreDiscussion: boolean; ts: Record<string, Date>; users: string[] }]
		> &
		StreamerKeyArgs<`${string}/deleteMessage`, [{ _id: IMessage['_id'] }]> &
		StreamerKeyArgs<`${string}/${string}`, []>;

	'room-messages': StreamerKeyArgs<string, [IMessage]>;

	'notify-all': StreamerKeyArgs<
		'deleteEmojiCustom',
		[
			{
				emojiData: IEmoji;
			},
		]
	> &
		StreamerKeyArgs<
			'updateCustomSound',
			[
				{
					soundData: ICustomSound;
				},
			]
		> &
		StreamerKeyArgs<'public-settings-changed', ['inserted' | 'updated' | 'removed' | 'changed', ISetting]>;

	'notify-user': StreamerKeyArgs<`${string}/rooms-changed`, [IRoom]> &
		StreamerKeyArgs<`${string}/subscriptions-changed`, [ISubscription]> &
		StreamerKeyArgs<`${string}/message`, [IMessage]> &
		StreamerKeyArgs<`${string}/force_logout`, []> &
		StreamerKeyArgs<
			`${string}/webdav`,
			[
				| {
						type: 'changed';
						account: Partial<IWebdavAccount>;
				  }
				| {
						type: 'removed';
						account: { _id: IWebdavAccount['_id'] };
				  },
			]
		> &
		StreamerKeyArgs<`${string}/e2ekeyRequest`, [string, string]> &
		StreamerKeyArgs<`${string}/notification`, [INotificationDesktop]> &
		StreamerKeyArgs<`${string}/voip.events`, [VoipEventDataSignature]> &
		StreamerKeyArgs<
			`${string}/call.hangup`,
			[
				{
					roomId: string;
				},
			]
		>;

	'importers': StreamerKeyArgs<'progress', [{ rate: number; count: { completed: number; total: number } }]>;

	'notify-logged': StreamerKeyArgs<'banner-changed', [{ bannerId: string }]> &
		StreamerKeyArgs<
			'roles-change',
			[
				{
					type: 'added' | 'removed' | 'changed';
					_id: IRole['_id'];
					u: {
						_id: IUser['_id'];
						username: IUser['username'];
						name: IUser['name'];
					};
					scope?: IRoom['_id'];
				},
			]
		> &
		StreamerKeyArgs<'Users:NameChanged', [Pick<IUser, '_id' | 'name'>]> &
		StreamerKeyArgs<'voip.statuschanged', [boolean]> &
		StreamerKeyArgs<'omnichannel.priority-changed', [{ id: 'added' | 'removed' | 'changed'; name: string }]>;

	'stdout': StreamerKeyArgs<
		'stdout',
		[
			{
				id: string;
				string: string;
				ts: Date;
			},
		]
	>;

	'room-data': StreamerKeyArgs<string, [IOmnichannelRoom]>;

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
	// 'notify-room-users': (e: `${string}/video-conference` | `${string}/webrtc` | `${string}/otr` | `${string}/userData`) => [void];

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
}

export type ServerStreamerNames = keyof StreamerEvents;

export type ServerStreamerParameters<MethodName extends ServerStreamerNames> = Parameters<StreamerEvents[MethodName]>;

export type ServerStreamerReturn<MethodName extends ServerStreamerNames> = ReturnType<StreamerEvents[MethodName]>;
