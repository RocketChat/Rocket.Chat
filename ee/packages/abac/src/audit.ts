import type { AbacActor } from '@rocket.chat/core-services';
import type {
	ExtractDataToParams,
	IAbacAttributeDefinition,
	IAuditServerActor,
	IServerEvents,
	AbacAuditServerEventKey,
	AbacAttributeDefinitionChangeType,
	AbacAuditReason,
	MinimalRoom,
	MinimalUser,
	AbacActionPerformed,
} from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

type EventParamsMap = {
	[K in AbacAuditServerEventKey]: ExtractDataToParams<IServerEvents[K]>;
};

type EventPayload<K extends AbacAuditServerEventKey> = EventParamsMap[K];

export type AbacAuditEventName = AbacAuditServerEventKey;

export type AbacAuditEventPayload<K extends AbacAuditEventName = AbacAuditEventName> = EventPayload<K>;

async function audit<K extends AbacAuditServerEventKey>(event: K, payload: EventPayload<K>, actor: IAuditServerActor): Promise<void> {
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
			{ type: 'user', _id: actor._id, username: actor.username!, ip: '0.0.0.0', useragent: '' },
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
			{ type: 'user', _id: actor._id, username: actor.username!, ip: '0.0.0.0', useragent: '' },
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
			{ type: 'user', _id: actor._id, username: actor.username!, ip: '0.0.0.0', useragent: '' },
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
			{ type: 'user', _id: actor._id, username: actor.username!, ip: '0.0.0.0', useragent: '' },
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
			{ type: 'user', _id: actor._id, username: actor.username!, ip: '0.0.0.0', useragent: '' },
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
			{ type: 'user', _id: actor._id, username: actor.username!, ip: '0.0.0.0', useragent: '' },
		);
	},
	actionPerformed: async (
		subject: MinimalUser,
		object: MinimalRoom,
		reason: AbacAuditReason = 'room-attributes-change',
		actionPerformed: AbacActionPerformed = 'revoked-object-access',
	) => {
		return audit(
			'abac.action.performed',
			{
				action: actionPerformed,
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
