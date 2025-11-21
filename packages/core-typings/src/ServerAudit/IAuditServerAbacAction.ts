import type { IUser, IRoom, IAuditServerEventType, IAbacAttributeDefinition } from '..';

export type MinimalUser = Pick<IUser, '_id' | 'username'>;
export type MinimalRoom = Pick<IRoom, '_id'>;

export type AbacAuditReason = 'ldap-sync' | 'room-attributes-change' | 'system' | 'api' | 'realtime-policy-eval';

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

export type AbacAttributeDefinitionDiff = {
	added?: string[];
	removed?: string[];
	renamedFrom?: string;
};

// Since user attributes can grow without limits, we're only logging the diffs
interface IServerEventAbacSubjectAttributeChanged
	extends IAuditServerEventType<
		{ key: 'subject'; value: MinimalUser } | { key: 'reason'; value: AbacAuditReason } | { key: 'diff'; value: IAbacAttributeDefinition[] }
	> {
	t: 'abac.subject.attribute.changed';
}

interface IServerEventAbacObjectAttributeChanged
	extends IAuditServerEventType<
		| { key: 'room'; value: MinimalRoom }
		| { key: 'reason'; value: AbacAuditReason }
		| { key: 'previous'; value: IAbacAttributeDefinition[] }
		| { key: 'current'; value: IAbacAttributeDefinition[] | null }
		| { key: 'change'; value: AbacAttributeDefinitionChangeType }
	> {
	t: 'abac.object.attribute.changed';
}

interface IServerEventAbacAttributeChanged
	extends IAuditServerEventType<
		| { key: 'attributeKey'; value: string }
		| { key: 'reason'; value: AbacAuditReason }
		| { key: 'change'; value: AbacAttributeDefinitionChangeType }
		| { key: 'current'; value: IAbacAttributeDefinition | null | undefined }
		| { key: 'diff'; value: IAbacAttributeDefinition | undefined }
	> {
	t: 'abac.attribute.changed';
}

interface IServerEventAbacActionPerformed
	extends IAuditServerEventType<
		| { key: 'action'; value: 'revoked-object-access' }
		| { key: 'reason'; value: AbacAuditReason }
		| { key: 'subject'; value: MinimalUser | undefined }
		| { key: 'object'; value: MinimalRoom | undefined }
	> {
	t: 'abac.action.performed';
}

export type ValidAbacEvents =
	| 'abac.subject.attribute.changed'
	| 'abac.object.attribute.changed'
	| 'abac.attribute.changed'
	| 'abac.action.performed'
	| 'abac.object.attributes.removed';

declare module '../IServerEvent' {
	interface IServerEvents {
		'abac.subject.attribute.changed': IServerEventAbacSubjectAttributeChanged;
		'abac.object.attribute.changed': IServerEventAbacObjectAttributeChanged;
		'abac.attribute.changed': IServerEventAbacAttributeChanged;
		'abac.action.performed': IServerEventAbacActionPerformed;
		'abac.object.attributes.removed': IServerEventAbacObjectAttributeChanged;
	}
}
