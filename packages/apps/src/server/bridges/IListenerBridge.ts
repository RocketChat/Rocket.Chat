import type { IMessage as IAppsMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import type { IRoom as IAppsRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { UIKitIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import type { ILivechatDepartment, ILivechatVisitor, IMessage, IOmnichannelRoom, IRoom, IUser } from '@rocket.chat/core-typings';

import type { AppEvents } from '../../AppsEngine';

export interface IListenerBridge {
	messageEvent(int: AppInterface, message: IAppsMessage): Promise<void | boolean | IAppsMessage>;
	roomEvent(int: AppInterface, room: IAppsRoom): Promise<void | boolean | IAppsRoom>;
	uiKitInteractionEvent(int: AppInterface, action: UIKitIncomingInteraction): Promise<void | boolean>;

	messageEvent(int: 'IPostMessageDeleted', message: IMessage, userDeleted: IUser): Promise<void>;
	messageEvent(int: 'IPostMessageReacted', message: IMessage, userReacted: IUser, reaction: string, isReacted: boolean): Promise<void>;
	messageEvent(int: 'IPostMessageFollowed', message: IMessage, userFollowed: IUser, isFollowed: boolean): Promise<void>;
	messageEvent(int: 'IPostMessagePinned', message: IMessage, userPinned: IUser, isPinned: boolean): Promise<void>;
	messageEvent(int: 'IPostMessageStarred', message: IMessage, userStarred: IUser, isStarred: boolean): Promise<void>;
	messageEvent(int: 'IPostMessageReported', message: IMessage, userReported: IUser, reason: boolean): Promise<void>;
	messageEvent(
		int: 'IPreMessageSentPrevent' | 'IPreMessageDeletePrevent' | 'IPreMessageUpdatedPrevent',
		message: IMessage,
	): Promise<boolean>;
	messageEvent(
		int: 'IPreMessageSentExtend' | 'IPreMessageSentModify' | 'IPreMessageUpdatedExtend' | 'IPreMessageUpdatedModify',
		message: IMessage,
	): Promise<IMessage>;
	messageEvent(int: 'IPostMessageSent' | 'IPostMessageUpdated' | 'IPostSystemMessageSent', message: IMessage): Promise<void>;

	roomEvent(int: 'IPreRoomUserJoined' | 'IPostRoomUserJoined', room: IRoom, joiningUser: IUser, invitingUser?: IUser): Promise<void>;
	roomEvent(int: 'IPreRoomUserLeave' | 'IPostRoomUserLeave', room: IRoom, leavingUser: IUser): Promise<void>;
	roomEvent(int: 'IPreRoomCreatePrevent' | 'IPreRoomDeletePrevent', room: IRoom): Promise<boolean>;
	roomEvent(int: 'IPreRoomCreateExtend' | 'IPreRoomCreateModify', room: IRoom): Promise<IRoom>;
	roomEvent(int: 'IPostRoomCreate' | 'IPostRoomDeleted', room: IRoom): Promise<void>;

	livechatEvent(
		int:
			| 'IPostLivechatAgentAssigned'
			| 'IPostLivechatAgentUnassigned'
			| 'IPostLivechatDepartmentRemoved'
			| 'IPostLivechatDepartmentDisabled',
		data: { user: IUser; room: IOmnichannelRoom },
	): Promise<void>;
	livechatEvent(
		int: 'IPostLivechatRoomTransferred',
		data: { type: 'agent'; room: IRoom['_id']; from: IUser['_id']; to: IUser['_id'] },
	): Promise<void>;
	livechatEvent(
		int: 'IPostLivechatRoomTransferred',
		data: { type: 'department'; room: IRoom['_id']; from: ILivechatDepartment['_id']; to: ILivechatDepartment['_id'] },
	): Promise<void>;
	livechatEvent(int: 'IPostLivechatGuestSaved', data: ILivechatVisitor['_id']): Promise<void>;
	livechatEvent(int: 'IPostLivechatRoomSaved', data: IRoom['_id']): Promise<void>;
	livechatEvent(
		int: 'ILivechatRoomClosedHandler' | 'IPostLivechatRoomStarted' | 'IPostLivechatRoomClosed' | 'IPreLivechatRoomCreatePrevent',
		data: IRoom,
	): Promise<void>;
	livechatEvent(int: AppEvents | AppEvents[keyof AppEvents], data: any): Promise<void>;
}
