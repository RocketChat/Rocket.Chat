import { IServiceClass } from './ServiceClass';

export interface IStreamService extends IServiceClass {
	sendUserAvatarUpdate({ username, etag }: { username: string; etag?: string }): void;
	sendRoomAvatarUpdate({ rid, etag }: { rid: string; etag?: string }): void;
	sendRoleUpdate(update: Record<string, any>): void;
}
