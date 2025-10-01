import type { IAbacAttributeDefinition, IRoom, IAbacAttribute } from '@rocket.chat/core-typings';

export interface IAbacService {
	toggleAbacConfigurationForRoom(rid: IRoom['_id']): Promise<void>;
	addAbacAttribute(attribute: IAbacAttributeDefinition): Promise<void>;
	listAbacAttributes(filters?: {
		key?: string;
		values?: string[];
		offset?: number;
		count?: number;
	}): Promise<{ attributes: IAbacAttribute[]; offset: number; count: number; total: number }>;
	updateAbacAttributeById(_id: string, update: { key?: string; values?: string[] }): Promise<void>;
}
