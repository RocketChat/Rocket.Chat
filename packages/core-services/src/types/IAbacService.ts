import type { IRoom } from '@rocket.chat/core-typings';

export interface IAbacService {
	toggleAbacConfigurationForRoom(rid: IRoom['_id']): Promise<void>;
}
