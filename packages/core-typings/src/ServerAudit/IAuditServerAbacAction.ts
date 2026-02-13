import type { IUser, IRoom, IAuditServerEventType, IAbacAttributeDefinition, IServerEvents, Optional } from '..';

export type MinimalUser = Pick<IUser, 'username'> & Optional<Pick<IUser, '_id'>, '_id'>;
export type MinimalRoom = Pick<IRoom, '_id' | 'name'>;

export type AbacAuditReason = 'ldap-sync' | 'room-attributes-change' | 'system' | 'api' | 'realtime-policy-eval';

export type AbacActionPerformed = 'revoked-object-access' | 'granted-object-access';

export type AbacAttributeDefinitionChangeType =
	| 'created'
	| 'updated'
	| 'deleted'
	| 'all-deleted'
	| 'key-removed'
	| 'key-renamed'
	| 'value-removed'
	| 'key-added'
	| 'key-updated';

// Since user attributes can grow without limits, we're only logging the diffs
export interface IServerEventAbacSubjectAttributeChanged
	extends IAuditServerEventType<
		{ key: 'subject'; value: MinimalUser } | { key: 'reason'; value: AbacAuditReason } | { key: 'diff'; value: IAbacAttributeDefinition[] }
	> {
	t: 'abac.subject.attribute.changed';
}

export interface IServerEventAbacObjectAttributeChanged
	extends IAuditServerEventType<
		| { key: 'room'; value: MinimalRoom }
		| { key: 'reason'; value: AbacAuditReason }
		| { key: 'previous'; value: IAbacAttributeDefinition[] }
		| { key: 'current'; value: IAbacAttributeDefinition[] | null }
		| { key: 'change'; value: AbacAttributeDefinitionChangeType }
	> {
	t: 'abac.object.attribute.changed';
}

export interface IServerEventAbacAttributeChanged
	extends IAuditServerEventType<
		| { key: 'attributeKey'; value: string }
		| { key: 'reason'; value: AbacAuditReason }
		| { key: 'change'; value: AbacAttributeDefinitionChangeType }
		| { key: 'current'; value: IAbacAttributeDefinition | null | undefined }
		| { key: 'diff'; value: IAbacAttributeDefinition | undefined }
	> {
	t: 'abac.attribute.changed';
}

export interface IServerEventAbacActionPerformed
	extends IAuditServerEventType<
		| { key: 'action'; value: AbacActionPerformed }
		| { key: 'reason'; value: AbacAuditReason }
		| { key: 'subject'; value: MinimalUser | undefined }
		| { key: 'object'; value: MinimalRoom | undefined }
	> {
	t: 'abac.action.performed';
}

export interface IServerEventAbacObjectAttributesRemoved
	extends IAuditServerEventType<
		| { key: 'room'; value: MinimalRoom }
		| { key: 'reason'; value: AbacAuditReason }
		| { key: 'previous'; value: IAbacAttributeDefinition[] }
		| { key: 'current'; value: IAbacAttributeDefinition[] | null }
		| { key: 'change'; value: AbacAttributeDefinitionChangeType }
	> {
	t: 'abac.object.attributes.removed';
}

// Utility type to extract all ABAC-related server event names
// (ensures that only events prefixed with "abac." are included)
export type AbacAuditServerEventKey = Extract<keyof IServerEvents, `abac.${string}`>;
