import type { IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';

export interface IAbacService {
	toggleAbacConfigurationForRoom(rid: IRoom['_id']): Promise<void>;
	addAbacAttribute(attribute: IAbacAttributeDefinition): Promise<void>;
}
