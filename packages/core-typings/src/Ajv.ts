import typia from 'typia';

import type { IBanner } from './IBanner';
import type { ICalendarEvent } from './ICalendarEvent';
import type { CallHistoryItem } from './ICallHistoryItem';
import type { CloudConfirmationPollData, CloudRegistrationIntentData, CloudRegistrationStatus } from './ICloud';
import type { ICustomSound } from './ICustomSound';
import type { ICustomUserStatus } from './ICustomUserStatus';
import type { IEmailInbox } from './IEmailInbox';
import type { IEmojiCustom } from './IEmojiCustom';
import type { IIntegration } from './IIntegration';
import type { IIntegrationHistory } from './IIntegrationHistory';
import type { IInvite } from './IInvite';
import type { IMeApiUser } from './IMeApiUser';
import type { IMessage } from './IMessage';
import type { IModerationAudit, IModerationReport } from './IModerationReport';
import type { IOAuthApps } from './IOAuthApps';
import type { IPermission } from './IPermission';
import type { IReadReceiptWithUser } from './IReadReceipt';
import type { IRole } from './IRole';
import type { IRoom, IDirectoryChannelResult, IRoomAdmin } from './IRoom';
import type { DeviceManagementSession, DeviceManagementPopulatedSession } from './ISession';
import type { ISubscription } from './ISubscription';
import type { ITeam } from './ITeam';
import type { IUploadWithUser } from './IUpload';
import type { IUser, IDirectoryUserResult } from './IUser';
import type { VideoConference, VideoConferenceInstructions } from './IVideoConference';
import type { SlashCommand } from './SlashCommands';
import type { VideoConferenceCapabilities } from './VideoConferenceCapabilities';
import type { IImport } from './import/IImport';
import type { IMediaCall } from './mediaCalls/IMediaCall';

export const schemas = typia.json.schemas<
	[
		(
			| ISubscription
			| IInvite
			| ICustomSound
			| IEmojiCustom
			| IMessage
			| IOAuthApps
			| IPermission
			| IMediaCall
			| IEmailInbox
			| IImport
			| ICalendarEvent
			| IRole
			| IRoom
			| IRoomAdmin
			| IDirectoryChannelResult
			| IUser
			| IDirectoryUserResult
			| VideoConference
			| VideoConferenceCapabilities
			| VideoConferenceInstructions
			| CloudConfirmationPollData
			| CloudRegistrationIntentData
			| CloudRegistrationStatus
			| IModerationAudit
			| IModerationReport
			| IBanner
			| IIntegration
			| IIntegrationHistory
			| IMeApiUser
			| IReadReceiptWithUser
			| ITeam
			| IUploadWithUser
			| DeviceManagementSession
			| DeviceManagementPopulatedSession
		),
		CallHistoryItem,
		ICustomUserStatus,
		SlashCommand,
	],
	// JSON Schema 2020-12 (OpenAPI 3.1): the consuming Ajv is `ajv/dist/2020`, which
	// only knows 2020-12 tuple keywords (prefixItems/items).
	'3.1'
>();

// typia emits OpenAPI 3.1 shapes that `ajv/dist/2020` rejects in strict mode at boot.
// Rewrite them in place to the equivalent 2020-12 form the runtime Ajv accepts, without
// changing what any schema actually validates:
//   - closed tuples: `additionalItems: false` (draft-07 keyword) -> `items: false`, and
//     pin minItems/maxItems to the tuple length so strictTuples is satisfied;
//   - discriminator: drop the `mapping` (Ajv resolves via propertyName + oneOf; mapping is
//     an unsupported redirection hint) and ensure `type: 'object'` for strictTypes;
//   - open objects: typia 13's 3.1 emit closes object schemas with
//     `additionalProperties: false`; the 9.x 3.0 emit these components were adopted
//     under left them open, and the REST response schemas rely on that — they compose
//     a component `$ref` with the `success` flag via `allOf` (+ `unevaluatedProperties`),
//     which a closed subschema can never satisfy (the sibling `success` is "additional"
//     inside the ref'd branch, 400-ing every such response in TEST_MODE). Dropping the
//     `false` restores the open components; `additionalProperties` carrying a schema
//     (Record types) is preserved.
const normalizeForAjv2020 = (node: unknown): void => {
	if (Array.isArray(node)) {
		node.forEach(normalizeForAjv2020);
		return;
	}
	if (!node || typeof node !== 'object') {
		return;
	}
	const record = node as Record<string, unknown>;

	if (record.additionalProperties === false) {
		delete record.additionalProperties;
	}
	if (
		!('type' in record) &&
		Array.isArray(record.oneOf) &&
		record.oneOf.length > 0 &&
		record.oneOf.every(
			(branch: unknown) =>
				!!branch &&
				typeof branch === 'object' &&
				!Array.isArray(branch) &&
				Object.keys(branch).every((key) => key === 'type') &&
				typeof (branch as Record<string, unknown>).type === 'string',
		)
	) {
		// Nullable scalars: typia 13 emits `T | null` as `oneOf: [{type:'null'},{type:'string'}]`
		// (9.x used `nullable: true`, which Ajv ignores). Under `coerceTypes`, `''` and `null`
		// satisfy BOTH branches (Ajv coerces between them), so oneOf's "exactly one" fails on
		// real data. A 2020-12 union `type` array validates the same values, and Ajv skips
		// coercion when the data already matches one of the listed types.
		record.type = [...new Set(record.oneOf.map((branch: { type: string }) => branch.type))];
		delete record.oneOf;
	}
	if ('additionalItems' in record) {
		if (!('items' in record)) {
			record.items = record.additionalItems;
		}
		delete record.additionalItems;
	}
	if (Array.isArray(record.prefixItems) && record.items === false) {
		record.minItems = record.prefixItems.length;
		record.maxItems = record.prefixItems.length;
	}
	if (record.discriminator && typeof record.discriminator === 'object') {
		delete (record.discriminator as Record<string, unknown>).mapping;
		if (!('type' in record)) {
			record.type = 'object';
		}
	}

	Object.values(record).forEach(normalizeForAjv2020);
};
normalizeForAjv2020(schemas);
