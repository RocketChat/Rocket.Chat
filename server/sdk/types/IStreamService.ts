import { IServiceClass } from './ServiceClass';
import { IMessage } from '../../../definition/IMessage';

export interface IStreamService extends IServiceClass {
	notifyAll(eventName: string, ...args: any[]): void;
	notifyUser(uid: string, eventName: string, ...args: any[]): void;
	sendPermission({ clientAction, data }: any): void;
	sendPrivateSetting({ clientAction, setting }: any): void;
	sendUserAvatarUpdate({ username, etag }: { username: string; etag?: string }): void;
	sendRoomAvatarUpdate({ rid, etag }: { rid: string; etag?: string }): void;
	sendRoleUpdate(update: Record<string, any>): void;
	sendDeleteCustomEmoji(emojiData: Record<string, any>): void;
	sendUpdateCustomEmoji(emojiData: Record<string, any>): void;
	sendUserDeleted(uid: string): void;
	sendUserNameChanged(userData: Record<string, any>): void;
	sendDeleteCustomUserStatus(userStatusData: Record<string, any>): void;
	sendUpdateCustomUserStatus(userStatusData: Record<string, any>): void;
	sendEphemeralMessage(uid: string, rid: string, message: Partial<IMessage>): void;
}
