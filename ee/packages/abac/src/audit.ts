import type { AbacActor } from '@rocket.chat/core-services';
import type {
	ExtractDataToParams,
	IAbacAttributeDefinition,
	IAuditServerActor,
	IAuditServerEventType,
	IRoom,
	IServerEvents,
	IUser,
} from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

type MinimalUser = Pick<IUser, '_id' | 'username'>;
type MinimalRoom = Pick<IRoom, '_id'>;

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

type ValidEvents =
	| 'abac.subject.attribute.changed'
	| 'abac.object.attribute.changed'
	| 'abac.attribute.changed'
	| 'abac.action.performed'
	| 'abac.object.attributes.removed';

declare module '@rocket.chat/core-typings' {
	interface IServerEvents {
		'abac.subject.attribute.changed': IServerEventAbacSubjectAttributeChanged;
		'abac.object.attribute.changed': IServerEventAbacObjectAttributeChanged;
		'abac.attribute.changed': IServerEventAbacAttributeChanged;
		'abac.action.performed': IServerEventAbacActionPerformed;
		'abac.object.attributes.removed': IServerEventAbacObjectAttributeChanged;
	}
}

type EventParamsMap = {
	[K in ValidEvents]: ExtractDataToParams<IServerEvents[K]>;
};

type EventPayload<K extends ValidEvents> = EventParamsMap[K];

export type AbacAuditEventName = ValidEvents;

export type AbacAuditEventPayload<K extends AbacAuditEventName = AbacAuditEventName> = EventPayload<K>;

async function audit<K extends ValidEvents>(event: K, payload: EventPayload<K>, actor: IAuditServerActor): Promise<void> {
	return ServerEvents.createAuditServerEvent(event, payload, actor);
}

export const Audit = {
	attributeCreated: async (attribute: IAbacAttributeDefinition, actor: AbacActor) => {
		return audit(
			'abac.attribute.changed',
			{
				attributeKey: attribute.key,
				reason: 'api',
				change: 'created',
				current: attribute,
			} as EventPayload<'abac.attribute.changed'>,
			{ type: 'user', ...(actor as any) },
		);
	},
	attributeUpdated: async (current: IAbacAttributeDefinition, diff: IAbacAttributeDefinition, actor: AbacActor) => {
		return audit(
			'abac.attribute.changed',
			{
				attributeKey: current.key,
				reason: 'api',
				change: 'updated',
				current,
				diff,
			},
			{ type: 'user', ...(actor as any) },
		);
	},
	attributeDeleted: async (attribute: IAbacAttributeDefinition, actor: AbacActor) => {
		return audit(
			'abac.attribute.changed',
			{
				attributeKey: attribute.key,
				reason: 'api',
				change: 'deleted',
				current: null,
				diff: attribute,
			},
			{ type: 'user', ...(actor as any) },
		);
	},
	objectAttributeChanged: async (
		minimalRoom: MinimalRoom,
		previous: IAbacAttributeDefinition[],
		current: IAbacAttributeDefinition[],
		change: AbacAttributeDefinitionChangeType,
		actor: AbacActor,
	) => {
		return audit(
			'abac.object.attribute.changed',
			{
				room: minimalRoom,
				reason: 'api',
				change,
				previous,
				current,
			},
			{ type: 'user', ...(actor as any) },
		);
	},
	objectAttributeRemoved: async (
		minimalRoom: MinimalRoom,
		previous: IAbacAttributeDefinition[],
		current: IAbacAttributeDefinition[],
		change: AbacAttributeDefinitionChangeType,
		actor: AbacActor,
	) => {
		return audit(
			'abac.object.attribute.changed',
			{
				room: minimalRoom,
				reason: 'api',
				change,
				previous,
				current,
			},
			{ type: 'user', ...(actor as any) },
		);
	},
	objectAttributesRemoved: async (minimalRoom: MinimalRoom, previous: IAbacAttributeDefinition[], actor: AbacActor) => {
		return audit(
			'abac.object.attributes.removed',
			{
				room: minimalRoom,
				reason: 'api',
				change: 'all-deleted',
				previous,
				current: null,
			},
			{ type: 'user', ...(actor as any) },
		);
	},
	actionPerformed: async (
		subject: MinimalUser | undefined,
		object: MinimalRoom | undefined,
		reason: AbacAuditReason = 'room-attributes-change',
	) => {
		return audit(
			'abac.action.performed',
			{
				action: 'revoked-object-access',
				reason,
				subject,
				object,
			},
			{ type: 'system' },
		);
	},
	subjectAttributeChanged: async (diff: IAbacAttributeDefinition[], subject: MinimalUser) => {
		return audit(
			'abac.subject.attribute.changed',
			{
				subject,
				reason: 'ldap-sync',
				diff,
			},
			{ type: 'system' },
		);
	},
};
