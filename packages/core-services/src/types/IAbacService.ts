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
	// Usage represents if the attribute values are in use or not. If no values are in use, the attribute is not in use.
	getAbacAttributeById(_id: string): Promise<{ key: string; values: string[]; usage: Record<string, boolean> }>;
	isAbacAttributeInUseByKey(key: string): Promise<boolean>;
	setRoomAbacAttributes(rid: string, attributes: Record<string, string[]>): Promise<void>;
}
