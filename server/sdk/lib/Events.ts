import { MessagePack } from 'msgpack5';

import { IInquiry } from '../../../definition/IInquiry';
import { IMessage } from '../../../definition/IMessage';
import { IRole } from '../../../definition/IRole';
import { IRoom } from '../../../definition/IRoom';
import { ISetting } from '../../../definition/ISetting';
import { ISubscription } from '../../../definition/ISubscription';
import { IUser } from '../../../definition/IUser';
import { AutoUpdateRecord } from '../types/IMeteor';
import { IEmoji } from '../../../definition/IEmoji';
import { IUserStatus } from '../../../definition/IUserStatus';

export type BufferList = ReturnType<MessagePack['encode']>;

export type EventSignatures = {
	'emoji.deleteCustom'(emoji: IEmoji): void;
	'emoji.updateCustom'(emoji: IEmoji): void;
	'license.module'(data: { module: string; valid: boolean }): void;
	'livechat-inquiry-queue-observer'(data: { action: string; inquiry: IInquiry }): void;
	'message'(data: { action: string; message: IMessage }): void;
	'meteor.autoUpdateClientVersionChanged'(data: {record: AutoUpdateRecord }): void;
	'meteor.loginServiceConfiguration'(data: { action: string; record: any }): void;
	'notify.ephemeralMessage'(uid: string, rid: string, message: Partial<IMessage>): void;
	'permission.changed'(data: { clientAction: string; data: any }): void;
	'role'(data: {type: 'changed' | 'removed' } & Partial<IRole>): void;
	'room'(data: { action: string; room: Partial<IRoom> }): void;
	'room.avatarUpdate'(room: Partial<IRoom>): void;
	'setting'(data: { action: string; setting: Partial<ISetting> }): void;
	'setting.privateChanged'(data: { clientAction: string; setting: any }): void;
	'stream'([streamer, eventName, payload]: [string, string, string]): void;
	'stream.ephemeralMessage'(uid: string, rid: string, message: Partial<IMessage>): void;
	'subscription'(data: { action: string; subscription: Partial<ISubscription> }): void;
	'user'(data: { action: string; user: Partial<IUser> }): void;
	'user.avatarUpdate'(user: Partial<IUser>): void;
	'user.deleted'(user: Partial<IUser>): void;
	'user.deleteCustomStatus'(userStatus: IUserStatus): void;
	'user.nameChanged'(user: Partial<IUser>): void;
	'user.name'(data: { action: string; user: Partial<IUser> }): void;
	'user.roleUpdate'(update: Record<string, any>): void;
	'user.updateCustomStatus'(userStatus: IUserStatus): void;
	'userpresence'(data: { action: string; user: Partial<IUser> }): void;
	'watch.messages'(data: { clientAction: string; message: Partial<IMessage> }): void;
	'watch.subscriptions'(data: { clientAction: string; subscription: Partial<ISubscription> }): void;
}
