import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { ISetting as AppsSetting } from '@rocket.chat/apps-engine/definition/settings';
import type {
	IEmailInbox,
	IEmoji,
	IInquiry,
	IInstanceStatus,
	IIntegration,
	IIntegrationHistory,
	ILivechatDepartmentAgents,
	ILoginServiceConfiguration,
	IMessage,
	INotificationDesktop,
	IPbxEvent,
	IRole,
	IRoom,
	ISetting,
	ISocketConnection,
	ISubscription,
	IUser,
	IInvite,
	ICustomSound,
	VoipEventDataSignature,
	UserStatus,
	ILivechatPriority,
	VideoConference,
	ICalendarNotification,
	AtLeast,
	ILivechatInquiryRecord,
	ILivechatAgent,
	IBanner,
	ILivechatVisitor,
	LicenseLimitKind,
	ICustomUserStatus,
	IWebdavAccountIntegration,
} from '@rocket.chat/core-typings';
import type * as UiKit from '@rocket.chat/ui-kit';

import type { AutoUpdateRecord } from '../types/IMeteor';

type ClientAction = 'inserted' | 'updated' | 'removed' | 'changed';

type LoginServiceConfigurationEvent = {
	id: string;
} & (
	| {
			clientAction: 'removed';
			data?: never;
	  }
	| {
			clientAction: Omit<ClientAction, 'removed'>;
			data: Partial<ILoginServiceConfiguration>;
	  }
);

export type EventSignatures = {
	'room.video-conference': (params: { rid: string; callId: string }) => void;
	'shutdown': (params: Record<string, string[]>) => void;
	'$services.changed': (info: { localService: boolean }) => void;
	'accounts.login': (info: { userId: string; connection: ISocketConnection }) => void;
	'accounts.logout': (info: { userId: string; connection: ISocketConnection }) => void;
	'authorization.guestPermissions': (permissions: string[]) => void;
	'socket.connected': (connection: ISocketConnection) => void;
	'socket.disconnected': (connection: ISocketConnection) => void;
	'banner.new'(bannerId: string): void;
	'banner.enabled'(bannerId: string): void;
	'banner.disabled'(bannerId: string): void;
	'banner.user'(userId: string, banner: IBanner): void;
	'emoji.deleteCustom'(emoji: IEmoji): void;
	'emoji.updateCustom'(emoji: IEmoji): void;
	'license.module'(data: { module: string; valid: boolean }): void;
	'license.sync'(): void;
	'license.actions'(actions: Record<Partial<LicenseLimitKind>, boolean>): void;

	'livechat-inquiry-queue-observer'(data: { action: string; inquiry: IInquiry }): void;
	'message'(data: { action: string; message: IMessage }): void;
	'meteor.clientVersionUpdated'(data: AutoUpdateRecord): void;
	'notify.desktop'(uid: string, data: INotificationDesktop): void;
	'notify.uiInteraction'(uid: string, data: UiKit.ServerInteraction): void;
	'notify.updateInvites'(uid: string, data: { invite: Omit<IInvite, '_updatedAt'> }): void;
	'notify.ephemeralMessage'(uid: string, rid: string, message: AtLeast<IMessage, 'msg'>): void;
	'notify.webdav'(
		uid: string,
		data:
			| {
					type: 'changed';
					account: IWebdavAccountIntegration;
			  }
			| {
					type: 'removed';
					account: { _id: IWebdavAccountIntegration['_id'] };
			  },
	): void;
	'notify.e2e.keyRequest'(rid: string, data: IRoom['e2eKeyId']): void;
	'notify.deleteMessage'(rid: string, data: { _id: string }): void;
	'notify.deleteMessageBulk'(
		rid: string,
		data: {
			rid: string;
			excludePinned: boolean;
			ignoreDiscussion: boolean;
			ts: Record<string, Date>;
			users: string[];
			ids?: string[]; // message ids have priority over ts
			showDeletedStatus?: boolean;
		},
	): void;
	'notify.deleteCustomSound'(data: { soundData: ICustomSound }): void;
	'notify.updateCustomSound'(data: { soundData: ICustomSound }): void;
	'notify.calendar'(uid: string, data: ICalendarNotification): void;
	'notify.messagesRead'(data: { rid: string; until: Date; tmid?: string }): void;
	'notify.importedMessages'(data: { roomIds: string[] }): void;
	'permission.changed'(data: { clientAction: ClientAction; data: any }): void;
	'room'(data: { action: string; room: Partial<IRoom> }): void;
	'room.avatarUpdate'(room: Pick<IRoom, '_id' | 'avatarETag'>): void;
	'setting'(data: { action: string; setting: Partial<ISetting> }): void;
	'stream'([streamer, eventName, payload]: [string, string, any[]]): void;
	'subscription'(data: { action: string; subscription: Partial<ISubscription> }): void;
	'user.avatarUpdate'(user: Partial<IUser>): void;
	'user.deleted'(
		user: Pick<IUser, '_id'>,
		data:
			| {
					messageErasureType: 'Delete';
			  }
			| {
					messageErasureType: 'Unlink';
					replaceByUser: { _id: IUser['_id']; username: IUser['username']; alias: string };
			  },
	): void;
	'user.deleteCustomStatus'(userStatus: Omit<ICustomUserStatus, '_updatedAt'>): void;
	'user.nameChanged'(user: Pick<IUser, '_id' | 'name' | 'username'>): void;
	'user.realNameChanged'(user: Partial<IUser>): void;
	'user.roleUpdate'(update: {
		type: 'added' | 'removed' | 'changed';
		_id: string;
		u?: { _id: IUser['_id']; username: IUser['username']; name?: IUser['name'] };
		scope?: string;
	}): void;
	'user.updateCustomStatus'(userStatus: Omit<ICustomUserStatus, '_updatedAt'>): void;
	'user.typing'(data: { user: Partial<IUser>; isTyping: boolean; roomId: string }): void;
	'user.video-conference'(data: {
		userId: IUser['_id'];
		action: string;
		params: {
			callId: VideoConference['_id'];
			uid: IUser['_id'];
			rid: IRoom['_id'];
		};
	}): void;
	'presence.status'(data: {
		user: Pick<IUser, '_id' | 'username' | 'status' | 'statusText' | 'name' | 'roles'>;
		previousStatus: UserStatus | undefined;
	}): void;
	'watch.messages'(data: { message: IMessage }): void;
	'watch.roles'(
		data:
			| { clientAction: Exclude<ClientAction, 'removed'>; role: IRole }
			| {
					clientAction: 'removed';
					role: {
						_id: string;
						name: string;
					};
			  },
	): void;
	'watch.rooms'(data: { clientAction: ClientAction; room: Pick<IRoom, '_id'> | IRoom }): void;
	'watch.subscriptions'(
		data:
			| {
					clientAction: 'updated' | 'inserted';
					subscription: Pick<
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
					>;
			  }
			| {
					clientAction: 'removed';
					subscription: {
						_id: string;
						u?: Pick<IUser, '_id' | 'username' | 'name'>;
						rid?: string;
					};
			  },
	): void;
	'watch.inquiries'(data: { clientAction: ClientAction; inquiry: ILivechatInquiryRecord; diff?: undefined | Record<string, any> }): void;
	'watch.settings'(data: { clientAction: ClientAction; setting: ISetting }): void;
	'watch.users'(
		data: {
			id: string;
		} & (
			| {
					clientAction: 'inserted';
					data: IUser;
			  }
			| {
					clientAction: 'removed';
			  }
			| {
					clientAction: 'updated';
					diff: Record<string, number>;
					unset: Record<string, number>;
			  }
		),
	): void;
	'watch.loginServiceConfiguration'(data: LoginServiceConfigurationEvent): void;
	'watch.instanceStatus'(data: {
		clientAction: ClientAction;
		data?: undefined | Partial<IInstanceStatus>;
		diff?: undefined | Record<string, any>;
		id: string;
	}): void;
	'watch.integrationHistory'(data: {
		clientAction: ClientAction;
		data: Partial<IIntegrationHistory>;
		diff?: undefined | Record<string, any>;
		id: string;
	}): void;
	'watch.integrations'(data: { clientAction: ClientAction; data: Partial<IIntegration>; id: string }): void;
	'watch.emailInbox'(data: { clientAction: ClientAction; data: Partial<IEmailInbox>; id: string }): void;
	'watch.livechatDepartmentAgents'(data: {
		clientAction: ClientAction;
		data: Partial<ILivechatDepartmentAgents>;
		diff?: undefined | Record<string, any>;
		id: string;
	}): void;
	'omnichannel.room'(
		roomId: string,
		data:
			| { type: 'agentStatus'; status: string }
			| { type: 'queueData'; data: { [k: string]: unknown } | undefined }
			| { type: 'agentData'; data: ILivechatAgent | undefined | { hiddenInfo: boolean } }
			| { type: 'visitorData'; visitor: ILivechatVisitor },
	): void;

	// Send all events from here
	'voip.events'(userId: string, data: VoipEventDataSignature): void;
	'call.callerhangup'(userId: string, data: { roomId: string }): void;
	'watch.pbxevents'(data: { clientAction: ClientAction; data: Partial<IPbxEvent>; id: string }): void;
	'connector.statuschanged'(enabled: boolean): void;
	'federation.userRoleChanged'(update: Record<string, any>): void;
	'watch.priorities'(data: {
		clientAction: ClientAction;
		data: Partial<ILivechatPriority>;
		id: string;
		diff?: Record<string, string>;
	}): void;
	'apps.added'(appId: string): void;
	'apps.removed'(appId: string): void;
	'apps.updated'(appId: string): void;
	'apps.statusUpdate'(appId: string, status: AppStatus): void;
	'apps.settingUpdated'(appId: string, setting: AppsSetting): void;
	'command.added'(command: string): void;
	'command.disabled'(command: string): void;
	'command.updated'(command: string): void;
	'command.removed'(command: string): void;
	'actions.changed'(): void;
};
