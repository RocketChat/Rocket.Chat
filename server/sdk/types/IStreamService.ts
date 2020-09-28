import { IServiceClass } from './ServiceClass';
import { IMessage } from '../../../definition/IMessage';

export enum STATUS_MAP {
	OFFLINE = 0,
	ONLINE = 1,
	AWAY = 2,
	BUDY = 3,
}

type Publication = {
	userId?: string;
}
type Rule = (this: Publication, eventName: string, ...args: any) => boolean | Promise<boolean>;

export interface IStreamer {
	serverOnly: boolean;

	allowEmit(eventName: string | boolean | Rule, fn?: Rule): Promise<boolean> | boolean | undefined;

	allowWrite(eventName: string | boolean | Rule, fn?: Rule): Promise<boolean> | boolean | undefined;

	allowRead(eventName: string | boolean | Rule, fn?: Rule): Promise<boolean> | boolean | undefined;

	emit(event: string, ...data: any[]): void;

	__emit(...data: any[]): void;

	emitWithoutBroadcast(event: string, ...data: any[]): void;
}

export interface IStreamerConstructor {
	// eslint-disable-next-line @typescript-eslint/no-misused-new
	new(name: string, options?: {retransmit?: boolean; retransmitToSelf?: boolean}): IStreamer;
}

export interface IStreamService extends IServiceClass {
	notifyAll(eventName: string, ...args: any[]): void;
	notifyUser(uid: string, eventName: string, ...args: any[]): void;
	sendUserStatus({ uid, username, status, statusText }: { uid: string; username: string; status: STATUS_MAP; statusText?: string }): void;
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
