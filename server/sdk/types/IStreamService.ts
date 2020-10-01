import { IServiceClass } from './ServiceClass';

export interface IStreamService extends IServiceClass {
	sendRoomAvatarUpdate({ rid, etag }: { rid: string; etag?: string }): void;
	sendRoleUpdate(update: Record<string, any>): void;
}
