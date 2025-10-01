import type { IAbacAttributeDefinition, IAbacAttribute } from '@rocket.chat/core-typings';

export interface IAbacService {
	addAbacAttribute(attribute: IAbacAttributeDefinition): Promise<void>;
	listAbacAttributes(filters?: {
		key?: string;
		values?: string[];
		offset?: number;
		count?: number;
	}): Promise<{ attributes: IAbacAttribute[]; offset: number; count: number; total: number }>;
	updateAbacAttributeById(_id: string, update: { key?: string; values?: string[] }): Promise<void>;
	deleteAbacAttributeById(_id: string): Promise<void>;
}
