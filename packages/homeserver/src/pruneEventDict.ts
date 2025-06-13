import { isRoomMemberEvent } from './core/events/m.room.member';

import type { EventBase } from './core/events/eventBase';

interface RoomVersion {
	updated_redaction_rules: boolean;
	restricted_join_rule_fix: boolean;
	implicit_room_creator: boolean;
	restricted_join_rule: boolean;
	special_case_aliases_auth: boolean;
	msc3389_relation_redactions: boolean;
}

interface JsonDict {
	[key: string]: any;
}

export function pruneEventDict<T extends EventBase>(
	eventDict: T,
	roomVersion: RoomVersion = {
		updated_redaction_rules: false,
		restricted_join_rule_fix: false,
		implicit_room_creator: false,
		restricted_join_rule: false,
		special_case_aliases_auth: false,
		msc3389_relation_redactions: false,
	},
): Partial<T> {
	/**
	 * Redacts the eventDict in the same way as `prune_event`, except it
	 * operates on objects rather than event instances.
	 *
	 * @returns A copy of the pruned event dictionary.
	 */

	const eventType = eventDict.type;

	const allowedKeys = [
		'event_id',
		'sender',
		'room_id',
		'hashes',
		'signatures',
		'content',
		'type',
		'state_key',
		'depth',
		'prev_events',
		'auth_events',
		'origin_server_ts',
		// Earlier room versions had additional allowed keys.
		...(!roomVersion.updated_redaction_rules
			? ['prev_state', 'membership', 'origin']
			: []),
	];

	const content: JsonDict = {};

	if (roomVersion.msc3389_relation_redactions) {
		const relatesTo =
			eventDict.content &&
			'm.relates_to' in eventDict.content &&
			(eventDict.content['m.relates_to'] as Record<string, unknown>);

		if (relatesTo && typeof relatesTo === 'object') {
			const newRelatesTo: JsonDict = {};
			for (const field of ['rel_type', 'event_id']) {
				if (field in relatesTo) {
					newRelatesTo[field] = relatesTo[field];
				}
			}
			if (Object.keys(newRelatesTo).length > 0) {
				content['m.relates_to'] = newRelatesTo;
			}
		}
	}

	const allowedFields: JsonDict = Object.fromEntries(
		Object.entries(eventDict).filter(([key]) => allowedKeys.includes(key)),
	);

	const unsigned: JsonDict = {};
	allowedFields.unsigned = unsigned;

	const eventUnsigned = eventDict.unsigned || {};
	if ('age_ts' in eventUnsigned) {
		unsigned.age_ts = eventUnsigned.age_ts;
	}
	if ('replaces_state' in eventUnsigned) {
		unsigned.replaces_state = eventUnsigned.replaces_state;
	}

	function addFields(...fields: string[]): void {
		if (!eventDict.content) {
			return;
		}

		for (const field of fields) {
			if (field in eventDict.content) {
				// @ts-ignore
				content[field] = eventDict.content[field];
			}
		}
	}

	if (isRoomMemberEvent(eventDict)) {
		const contentKeys = [
			'membership',
			...(roomVersion.restricted_join_rule_fix ? ['authorising_user'] : []),
		];

		addFields(...contentKeys);

		if (roomVersion.updated_redaction_rules) {
			// @ts-ignore
			const thirdPartyInvite = eventDict.content.third_party_invite;
			if (thirdPartyInvite && typeof thirdPartyInvite === 'object') {
				content.third_party_invite = {};
				if ('signed' in thirdPartyInvite) {
					content.third_party_invite.signed = thirdPartyInvite.signed;
				}
			}
		}
	}

	if (eventType === 'm.room.create') {
		if (roomVersion.updated_redaction_rules) {
			return {
				...allowedFields,
				content: eventDict.content,
			} as T;
		}
		if (!roomVersion.implicit_room_creator) {
			addFields('creator');
		}
	}

	if (eventType === 'm.room.join_rules') {
		addFields(
			'join_rule',
			...(roomVersion.restricted_join_rule ? ['allow'] : []),
		);
	}

	if (eventType === 'm.room.power_levels') {
		addFields(
			'users',
			'users_default',
			'events',
			'events_default',
			'state_default',
			'ban',
			'kick',
			'redact',
			...(roomVersion.updated_redaction_rules ? ['invite'] : []),
		);
	}

	if (eventType === 'm.room.aliases' && roomVersion.special_case_aliases_auth) {
		addFields('aliases');
	}

	if (eventType === 'm.room.history_visibility') {
		addFields('history_visibility');
	}

	if (eventType === 'm.room.redaction' && roomVersion.updated_redaction_rules) {
		addFields('redacts');
	}

	return {
		...allowedFields,
		content,
	} as Partial<T>;
}
