import type { AbacAttributeStoreType, AbacPdpType } from './ServerAudit/IAuditServerAbacAction';

export enum AbacAccessOperation {
	READ = 'read',
	WRITE = 'write',
}

export enum AbacObjectType {
	ROOM = 'room',
	// Just room for now :)
}

export const isAbacPdpType = (value: unknown): value is AbacPdpType => value === 'local' || value === 'virtru';

export const isAbacAttributeStoreType = (value: unknown): value is AbacAttributeStoreType => value === 'local' || value === 'virtru';
