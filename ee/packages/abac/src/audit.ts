import type { AbacActor } from '@rocket.chat/core-services';
import type {
	ExtractDataToParams,
	IAbacAttributeDefinition,
	IAuditServerActor,
	IServerEvents,
	AbacAuditServerEventKey,
	AbacAttributeDefinitionChangeType,
	AbacAuditReason,
	AbacAttributeStoreType,
	AbacPdpType,
	MinimalRoom,
	MinimalUser,
	AbacActionPerformed,
} from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

import { logger } from './logger';

type EventParamsMap = {
	[K in AbacAuditServerEventKey]: ExtractDataToParams<IServerEvents[K]>;
};

type EventPayload<K extends AbacAuditServerEventKey> = EventParamsMap[K];

export type AbacAuditEventName = AbacAuditServerEventKey;

export type AbacAuditEventPayload<K extends AbacAuditEventName = AbacAuditEventName> = EventPayload<K>;

async function audit<K extends AbacAuditServerEventKey>(event: K, payload: EventPayload<K>, actor: IAuditServerActor): Promise<void> {
	return ServerEvents.createAuditServerEvent(event, payload, actor).catch((err) =>
		logger.error({ msg: 'Failed to write ABAC audit event', event, err }),
	);
}

const toUserActor = (actor: AbacActor): IAuditServerActor => ({
	type: 'user',
	_id: actor._id,
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- ABAC changes are made by users with a username
	username: actor.username!,
	ip: '0.0.0.0',
	useragent: '',
});

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
			toUserActor(actor),
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
			toUserActor(actor),
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
			toUserActor(actor),
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
			toUserActor(actor),
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
			toUserActor(actor),
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
			toUserActor(actor),
		);
	},
	actionPerformed: async (
		subject: MinimalUser,
		object: MinimalRoom,
		reason: AbacAuditReason = 'room-attributes-change',
		actionPerformed: AbacActionPerformed = 'revoked-object-access',
		pdp?: AbacPdpType,
	) => {
		return audit(
			'abac.action.performed',
			{
				action: actionPerformed,
				reason,
				subject,
				object,
				pdp,
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
	attributeStoreSwitched: async (from: AbacAttributeStoreType, to: AbacAttributeStoreType, roomsAffected: number) => {
		return audit('abac.attribute.store.switched', { from, to, reason: 'attribute-store-switch', roomsAffected }, { type: 'system' });
	},
};
