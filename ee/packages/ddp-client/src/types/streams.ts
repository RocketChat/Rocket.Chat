import type { ISetting as AppsSetting } from '@rocket.chat/apps-engine/definition/settings';
import type { IUIKitInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
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
	IOmnichannelCannedResponse,
	IIntegrationHistory,
	IUserDataEvent,
	ICalendarNotification,
	IUserStatus,
	ILivechatInquiryRecord,
} from '@rocket.chat/core-typings';

type ClientAction = 'inserted' | 'updated' | 'removed' | 'changed';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface StreamerEvents {
	'roles': [
		{
			key: 'roles';
			args: [
				IRole & {
					type: 'inserted' | 'updated' | 'removed' | 'changed';
				},
			];
		},
	];

	'notify-room': [
		{ key: `${string}/user-activity`; args: [username: string, activities: string[]] },
		{ key: `${string}/typing`; args: [username: string, typing: boolean] },
		{
			key: `${string}/deleteMessageBulk`;
			args: [args: { rid: IMessage['rid']; excludePinned: boolean; ignoreDiscussion: boolean; ts: Record<string, Date>; users: string[] }];
		},
		{ key: `${string}/deleteMessage`; args: [{ _id: IMessage['_id'] }] },
		{ key: `${string}/e2e.keyRequest`; args: [unknown] },
		{ key: `${string}/videoconf`; args: [id: string] },
		/* @deprecated over videoconf*/
		// { key: `${string}/${string}`; args: [id: string] },
	];

	'room-messages': [{ key: '__my_messages__'; args: [IMessage] }, { key: string; args: [IMessage] }];

	'notify-all': [
		{
			key: 'public-info';
			args: [
				| [key: 'public-settings-changed', args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting]]
				| [key: 'deleteCustomSound', args: [{ soundData: ICustomSound }]]
				| [key: 'updateCustomSound', args: [{ soundData: ICustomSound }]],
			];
		},
		{ key: 'public-settings-changed'; args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting] },
		{ key: 'deleteCustomSound'; args: [{ soundData: ICustomSound }] },
		{ key: 'updateCustomSound'; args: [{ soundData: ICustomSound }] },
	];

	'notify-user': [
		{ key: `${string}/rooms-changed`; args: ['inserted' | 'updated' | 'removed', IRoom] },
		{
			key: `${string}/subscriptions-changed`;
			args:
				| [
						'removed',
						{
							_id: string;
							u?: Pick<IUser, '_id' | 'username' | 'name'>;
							rid?: string;
						},
				  ]
				| [
						'inserted' | 'updated',
						Pick<
							ISubscription,
							| 't'
							| 'ts'
							| 'ls'
							| 'lr'
							| 'name'
							| 'fname'
							| 'rid'
							| 'code'
							| 'f'
							| 'u'
							| 'open'
							| 'alert'
							| 'roles'
							| 'unread'
							| 'prid'
							| 'userMentions'
							| 'groupMentions'
							| 'archived'
							| 'audioNotificationValue'
							| 'desktopNotifications'
							| 'mobilePushNotifications'
							| 'emailNotifications'
							| 'desktopPrefOrigin'
							| 'mobilePrefOrigin'
							| 'emailPrefOrigin'
							| 'unreadAlert'
							| '_updatedAt'
							| 'blocked'
							| 'blocker'
							| 'autoTranslate'
							| 'autoTranslateLanguage'
							| 'disableNotifications'
							| 'hideUnreadStatus'
							| 'hideMentionStatus'
							| 'muteGroupMentions'
							| 'ignored'
							| 'E2EKey'
							| 'E2ESuggestedKey'
							| 'tunread'
							| 'tunreadGroup'
							| 'tunreadUser'

							// Omnichannel fields
							| 'department'
							| 'v'
							| 'onHold'
						>,
				  ];
		},

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
		{ key: `${string}/uiInteraction`; args: [IUIKitInteraction] },
		{
			key: `${string}/video-conference`;
			args: [{ action: string; params: { callId: VideoConference['_id']; uid: IUser['_id']; rid: IRoom['_id'] } }];
		},
		{ key: `${string}/userData`; args: [IUserDataEvent] },
		{ key: `${string}/updateInvites`; args: [unknown] },
		{ key: `${string}/departmentAgentData`; args: [unknown] },
		{ key: `${string}/webrtc`; args: unknown[] },
		{
			key: `${string}/otr`;
			args: [
				'handshake' | 'acknowledge' | 'deny' | 'end',
				{
					roomId: IRoom['_id'];
					userId: IUser['_id'];
				},
			];
		},
		{ key: `${string}/calendar`; args: [ICalendarNotification] },
	];

	'importers': [
		{
			key: 'progress';
			args: [
				{
					step?:
						| 'importer_new'
						| 'importer_uploading'
						| 'importer_downloading_file'
						| 'importer_file_loaded'
						| 'importer_preparing_started'
						| 'importer_preparing_users'
						| 'importer_preparing_channels'
						| 'importer_preparing_messages'
						| 'importer_user_selection'
						| 'importer_importing_started'
						| 'importer_importing_users'
						| 'importer_importing_channels'
						| 'importer_importing_messages'
						| 'importer_importing_files'
						| 'importer_finishing'
						| 'importer_done'
						| 'importer_import_failed'
						| 'importer_import_cancelled';
					rate: number;
					key?: string;
					name?: string;
					count?: { completed: number; total: number };
				},
			];
		},
	];

	'notify-logged': [
		{
			key: 'updateCustomUserStatus';
			args: [
				{
					userStatusData: IUserStatus;
				},
			];
		},
		{ key: 'permissions-changed'; args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting] },
		{ key: 'deleteEmojiCustom'; args: [{ emojiData: IEmoji }] },
		{ key: 'updateEmojiCustom'; args: [{ emojiData: IEmoji }] },
		/* @deprecated */
		{ key: 'new-banner'; args: [{ bannerId: string }] },

		{
			key: `${string}/otr`;
			args: [
				'handshake' | 'acknowledge' | 'deny' | 'end',
				{
					roomId: IRoom['_id'];
					userId: IUser['_id'];
				},
			];
		},
		{ key: `${string}/webrtc`; args: [unknown] },

		{ key: 'banner-changed'; args: [{ bannerId: string }] },
		{
			key: 'roles-change';
			args: [
				{
					type: 'added' | 'removed' | 'changed';
					_id: IRole['_id'];
					u?: { _id: IUser['_id']; username: IUser['username']; name?: IUser['name'] };
					scope?: string;
				},
			];
		},
		{ key: 'Users:NameChanged'; args: [Pick<IUser, '_id' | 'name'>] },
		{ key: 'private-settings-changed'; args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting] },
		{ key: 'deleteCustomUserStatus'; args: [{ userStatusData: unknown }] },
		{ key: 'user-status'; args: [[IUser['_id'], IUser['username'], 0 | 1 | 2 | 3, IUser['statusText'], IUser['name'], IUser['roles']]] },
		{
			key: 'Users:Deleted';
			args: [
				{
					userId: IUser['_id'];
				},
			];
		},
		{
			key: 'updateAvatar';
			args: [{ username: IUser['username']; etag: IUser['avatarETag'] } | { rid: IRoom['_id']; etag: IRoom['avatarETag'] }];
		},

		{ key: 'voip.statuschanged'; args: [boolean] },
		{ key: 'omnichannel.priority-changed'; args: [{ id: string; clientAction: ClientAction; name?: string }] },
	];

	'stdout': [{ key: 'stdout'; args: [{ id: string; string: string; ts: Date }] }];

	'room-data': [{ key: string; args: [IOmnichannelRoom | Pick<IOmnichannelRoom, '_id'>] }];

	'notify-room-users': [
		{
			key: `${string}/video-conference`;
			args: [{ action: string; params: { callId: VideoConference['_id']; uid: IUser['_id']; rid: IRoom['_id'] } }];
		},
		{ key: `${string}/webrtc`; args: unknown[] },
		{
			key: `${string}/otr`;
			args: [
				'handshake' | 'acknowledge' | 'deny' | 'end',
				{
					roomId: IRoom['_id'];
					userId: IUser['_id'];
				},
			];
		},
		{ key: `${string}/userData`; args: unknown[] },
	];

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
				  }
				| {
						type: 'agentData';
						data: unknown;
				  }
				| {
						type: 'visitorData';
						visitor: unknown;
				  },
			];
		},
	];

	'user-presence': [{ key: string; args: [[username: string, statusChanged?: 0 | 1 | 2 | 3, statusText?: string]] }];

	// TODO: rename to 'integration-history'
	'integrationHistory': [
		{
			key: string;
			args: [
				| { type: 'removed'; id: string }
				| {
						id: string;
						diff: unknown;
						type: 'updated';
				  }
				| {
						type: 'inserted';
						data: Partial<IIntegrationHistory>;
				  },
			];
		},
	];

	'canned-responses': [
		{
			key: 'canned-responses';
			args:
				| [{ type: 'removed'; _id: string }, { agentsId: string }]
				| [{ type: 'removed'; _id: string }]
				| [
						{ type: 'changed' } & Omit<IOmnichannelCannedResponse, '_updatedAt' | '_createdAt'> & {
								_createdAt?: Date | undefined;
							},
				  ]
				| [{ type: 'changed' } & IOmnichannelCannedResponse, { agentsId: string }];
		},
	];

	'livechat-inquiry-queue-observer': [
		{
			key: 'public';
			args: [
				{
					type: 'added' | 'removed' | 'changed';
				} & ILivechatInquiryRecord,
			];
		},
		{
			key: `department/${string}`;
			args: [
				{
					type: 'added' | 'removed' | 'changed';
				} & ILivechatInquiryRecord,
			];
		},
		{
			key: `${string}`;
			args: [
				{
					_id: string;
					clientAction: string;
				},
			];
		},
	];

	'apps': [
		{ key: 'app/added'; args: [string] },
		{ key: 'app/removed'; args: [string] },
		{ key: 'app/updated'; args: [string] },
		{
			key: 'app/statusUpdate';
			args: [
				{
					appId: string;
					status: AppStatus;
				},
			];
		},
		{
			key: 'app/settingUpdated';
			args: [
				{
					appId: string;
					setting: AppsSetting;
				},
			];
		},
		{ key: 'command/added'; args: [string] },
		{ key: 'command/disabled'; args: [string] },
		{ key: 'command/updated'; args: [string] },
		{ key: 'command/removed'; args: [string] },
		{ key: 'actions/changed'; args: [] },
		{
			key: 'apps';
			args: [
				| [key: 'app/added', args: [string]]
				| [key: 'app/removed', args: [string]]
				| [key: 'app/updated', args: [string]]
				| [
						key: 'app/statusUpdate',
						args: [
							{
								appId: string;
								status: AppStatus;
							},
						],
				  ]
				| [
						key: 'app/settingUpdated',
						args: [
							{
								appId: string;
								setting: AppsSetting;
							},
						],
				  ]
				| [key: 'command/added', args: [string]]
				| [key: 'command/disabled', args: [string]]
				| [key: 'command/updated', args: [string]]
				| [key: 'command/removed', args: [string]]
				| [key: 'actions/changed', args: []],
			];
		},
	];

	'apps-engine': [
		{ key: 'app/added'; args: [string] },
		{ key: 'app/removed'; args: [string] },
		{ key: 'app/updated'; args: [string] },
		{
			key: 'app/statusUpdate';
			args: [
				{
					appId: string;
					status: AppStatus;
				},
			];
		},
		{
			key: 'app/settingUpdated';
			args: [
				{
					appId: string;
					setting: AppsSetting;
				},
			];
		},
		{ key: 'command/added'; args: [string] },
		{ key: 'command/disabled'; args: [string] },
		{ key: 'command/updated'; args: [string] },
		{ key: 'command/removed'; args: [string] },
		{ key: 'actions/changed'; args: [] },
	];
	'local': [
		{
			key: 'broadcast';
			args: any[];
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

export type StreamerCallback<N extends StreamNames, K extends StreamKeys<N>> = (...args: StreamerCallbackArgs<N, K>) => void;
