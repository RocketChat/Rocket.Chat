import { IServiceClass } from './ServiceClass';
import { IMessage } from '../../../definition/IMessage';

export interface IStreamService extends IServiceClass {
	notifyAll(eventName: string, ...args: any[]): void;
	notifyUser(uid: string, eventName: string, ...args: any[]): void;
	sendUserAvatarUpdate({ username, etag }: { username: string; etag?: string }): void;
	sendRoomAvatarUpdate({ rid, etag }: { rid: string; etag?: string }): void;
	sendRoleUpdate(update: Record<string, any>): void;
	sendEphemeralMessage(uid: string, rid: string, message: Partial<IMessage>): void;
}
