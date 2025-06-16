import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { ISetting as AppsSetting } from '@rocket.chat/apps-engine/definition/settings';
import type {
	IMessage,
	IRoom,
	ISetting,
	ISubscription,
	IRole,
	IEmoji,
	ICustomSound,
	INotificationDesktop,
	VoipEventDataSignature,
	IUser,
	IOmnichannelRoom,
	VideoConference,
	IOmnichannelCannedResponse,
	IIntegrationHistory,
	IUserDataEvent,
	ICalendarNotification,
	ILivechatInquiryRecord,
	ILivechatAgent,
	IImportProgress,
	IBanner,
	LicenseLimitKind,
	ICustomUserStatus,
	IWebdavAccount,
} from '@rocket.chat/core-typings';
import type * as UiKit from '@rocket.chat/ui-kit';

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
			args: [
				args: {
					rid: IMessage['rid'];
					excludePinned: boolean;
					ignoreDiscussion: boolean;
					ts: Record<string, Date>;
					users: string[];
					ids?: string[]; // message ids have priority over ts
					showDeletedStatus?: boolean;
				},
			];
		},
		{ key: `${string}/deleteMessage`; args: [{ _id: IMessage['_id'] }] },
		{ key: `${string}/e2e.keyRequest`; args: [unknown] },
		{ key: `${string}/videoconf`; args: [id: string] },
		{ key: `${string}/messagesRead`; args: [{ until: Date; tmid?: string }] },
		{ key: `${string}/messagesImported`; args: [null] },
		{
			key: `${string}/webrtc`;
			args: [
				type: 'status',
				data: {
					from?: string;
					room?: string;
					to?: string;
					media: MediaStreamConstraints;
					remoteConnections: {
						id: string;
						media: MediaStreamConstraints;
					}[];
				},
			];
		},
		/* @deprecated over videoconf*/
		// { key: `${string}/${string}`; args: [id: string] },
	];

	'room-messages': [{ key: '__my_messages__'; args: [IMessage] }, { key: string; args: [message: IMessage, user?: IUser, room?: IRoom] }];

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
		{ key: 'license'; args: [{ preventedActions: Record<LicenseLimitKind, boolean> }] | [] },
	];

	'notify-user': [
		{ key: `${string}/rooms-changed`; args: ['inserted' | 'updated' | 'removed' | 'changed', IRoom] },
		{
			key: `${string}/subscriptions-changed`;
			args:
				| [
						'removed',
						{
							_id: string;
							u?: Pick<IUser, '_id' | 'username' | 'name'>;
							rid?: string;
							t?: string;
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
							| 'oldRoomKeys'
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
		{ key: `${string}/uiInteraction`; args: [UiKit.ServerInteraction] },
		{
			key: `${string}/video-conference`;
			args: [{ action: string; params: { callId: VideoConference['_id']; uid: IUser['_id']; rid: IRoom['_id'] } }];
		},
		{ key: `${string}/userData`; args: [IUserDataEvent] },
		{ key: `${string}/updateInvites`; args: [unknown] },
		{ key: `${string}/departmentAgentData`; args: [unknown] },
		{
			key: `${string}/webrtc`;
			args:
				| [
						type: 'candidate',
						data: {
							from?: string;
							room?: string;
							to?: string;
							candidate: RTCIceCandidateInit;
						},
				  ]
				| [
						type: 'description',
						data:
							| {
									from?: string;
									room?: string;
									to?: string;
									type: 'offer';
									ts: number;
									media: MediaStreamConstraints;
									description: RTCSessionDescriptionInit;
							  }
							| {
									from?: string;
									room?: string;
									to?: string;
									type: 'answer';
									ts: number;
									media?: undefined;
									description: RTCSessionDescriptionInit;
							  },
				  ]
				| [
						type: 'join',
						data: {
							from?: string;
							room?: string;
							to?: string;
							media?: MediaStreamConstraints;
							monitor?: boolean;
						},
				  ];
		},
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
		{ key: `${string}/banners`; args: [IBanner] },
	];

	'importers': [
		{
			key: 'progress';
			args: [{ rate: number } | IImportProgress];
		},
	];

	'notify-logged': [
		{
			key: 'updateCustomUserStatus';
			args: [
				{
					userStatusData: Omit<ICustomUserStatus, '_updatedAt'>;
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
		{ key: 'Users:NameChanged'; args: [Pick<IUser, '_id' | 'name' | 'username'>] },
		{ key: 'private-settings-changed'; args: ['inserted' | 'updated' | 'removed' | 'changed', ISetting] },
		{ key: 'deleteCustomUserStatus'; args: [{ userStatusData: Omit<ICustomUserStatus, '_updatedAt'> }] },
		{
			key: 'user-status';
			args: [
				[
					uid: IUser['_id'],
					username: IUser['username'],
					status: 0 | 1 | 2 | 3,
					statusText: IUser['statusText'],
					name: IUser['name'],
					roles: IUser['roles'],
				],
			];
		},
		{
			key: 'Users:Deleted';
			args: [
				| {
						userId: IUser['_id'];
						messageErasureType: 'Delete';
						replaceByUser?: never;
				  }
				| {
						userId: IUser['_id'];
						messageErasureType: 'Unlink';
						replaceByUser?: { _id: IUser['_id']; username: IUser['username']; alias: string };
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
		{
			key: `${string}/webrtc`;
			args: [
				type: 'call',
				data: {
					from?: string;
					room?: string;
					to?: string;
					media: MediaStreamConstraints;
					monitor?: boolean;
				},
			];
		},
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
						type: 'queueData';
						data:
							| {
									[k: string]: unknown;
							  }
							| undefined;
				  }
				| {
						type: 'agentData';
						data: ILivechatAgent | undefined | { hiddenInfo: boolean };
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
			key: `agent/${string}`;
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

export type StreamerConfig<N extends StreamNames, K extends StreamKeys<N>> =
	StreamerConfigs<N> extends infer U ? (U extends any ? ({ key: K; args: any } extends U ? U : never) : never) : never;

export type StreamerCallbackArgs<N extends StreamNames, K extends StreamKeys<N>> =
	StreamerConfig<N, K> extends {
		args: any;
	}
		? StreamerConfig<N, K>['args']
		: never;

export type StreamerCallback<N extends StreamNames, K extends StreamKeys<N>> = (...args: StreamerCallbackArgs<N, K>) => void;
