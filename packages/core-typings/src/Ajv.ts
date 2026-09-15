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

const generatedSchemas = typia.json.schemas<
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
	'3.1'
>();

/**
 * typia mixes dialects on tuples: it emits `prefixItems` (JSON Schema 2020) alongside
 * `additionalItems`, a keyword 2020 removed in favour of `items` applied after `prefixItems`. AJV
 * runs in 2020 and refuses the unknown keyword, so the fix happens once, here, and both the runtime
 * validation and the OpenAPI document get schemas in a single dialect. `minItems` comes along
 * because a closed tuple has a known length, and AJV asks for it.
 *
 * Two more differences between what typia writes for 3.1 and what AJV reads:
 *
 * - the `mapping` of a discriminator, which AJV rejects outright. A validator that chokes on
 *   `IMessage` leaves every schema referencing it unresolvable, so the mapping goes and the
 *   `propertyName` stays;
 * - a nullable field written as `oneOf: [{ type: 'null' }, { type: 'string' }]`, where 3.0 wrote
 *   `nullable`. The API validates with `coerceTypes`, which coerces the value for each branch in
 *   turn until more than one matches, and then `oneOf` - exactly one - fails on a perfectly valid
 *   payload. Branches that only name a type collapse into a single `type` array, which says the same
 *   thing and leaves nothing to disambiguate.
 */
/** Keys whose values are maps of names to schemas, where a name is not a keyword. */
const SCHEMA_MAPS = ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'];

const toDraft2020 = <T>(node: T, insideSchemaMap = false): T => {
	if (Array.isArray(node)) {
		return node.map((entry) => toDraft2020(entry)) as T;
	}

	if (!node || typeof node !== 'object') {
		return node;
	}

	const schema = Object.fromEntries(
		Object.entries(node).map(([key, value]) => [
			!insideSchemaMap && key === 'additionalItems' ? 'items' : key,
			toDraft2020(value, SCHEMA_MAPS.includes(key)),
		]),
	) as Record<string, unknown>;

	if (insideSchemaMap) {
		return schema as T;
	}

	if (Array.isArray(schema.prefixItems) && schema.items === false && schema.minItems === undefined) {
		schema.minItems = schema.prefixItems.length;
	}

	if (schema.discriminator && typeof schema.discriminator === 'object') {
		const { mapping, ...discriminator } = schema.discriminator as Record<string, unknown>;
		schema.discriminator = discriminator;
	}

	if (Array.isArray(schema.oneOf)) {
		const branches = schema.oneOf as Record<string, unknown>[];
		const namesATypeOnly = (branch: Record<string, unknown>) => Object.keys(branch).length === 1 && typeof branch.type === 'string';

		if (branches.length > 1 && branches.every(namesATypeOnly)) {
			const { oneOf, ...rest } = schema;

			return { ...rest, type: branches.map((branch) => branch.type) } as T;
		}
	}

	return schema as T;
};

export const schemas = toDraft2020(generatedSchemas);
