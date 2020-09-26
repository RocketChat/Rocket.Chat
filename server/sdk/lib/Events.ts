import { MessagePack } from 'msgpack5';

import { IInquiry } from '../../../definition/IInquiry';
import { IMessage } from '../../../definition/IMessage';
import { IRole } from '../../../definition/IRole';
import { IRoom } from '../../../definition/IRoom';
import { ISetting } from '../../../definition/ISetting';
import { ISubscription } from '../../../definition/ISubscription';
import { IUser } from '../../../definition/IUser';
import { AutoUpdateRecord } from '../types/IMeteor';

export type BufferList = ReturnType<MessagePack['encode']>;

export type EventSignatures = {
	'livechat-inquiry-queue-observer'(data: {action: string; inquiry: IInquiry}): void;
	'stream'([streamer, eventName, payload]: [string, string, string]): void;
	'subscription'(data: { action: string; subscription: Partial<ISubscription> }): void;
	'room'(data: { action: string; room: Partial<IRoom> }): void;
	'message'(data: { action: string; message: IMessage }): void;
	'setting'(data: { action: string; setting: Partial<ISetting> }): void;
	'userpresence'(data: { action: string; user: Partial<IUser> }): void;
	'user'(data: { action: string; user: Partial<IUser> }): void;
	'user.name'(data: { action: string; user: Partial<IUser> }): void;
	'role'(data: {type: 'changed' | 'removed' } & Partial<IRole>): void;
	'license.module'(data: {module: string; valid: boolean}): void;
	'meteor.autoUpdateClientVersionChanged'(data: {record: AutoUpdateRecord}): void;
}
