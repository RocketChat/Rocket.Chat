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
//     an unsupported redirection hint) and ensure `type: 'object'` for strictTypes.
const normalizeForAjv2020 = (node: unknown): void => {
	if (Array.isArray(node)) {
		node.forEach(normalizeForAjv2020);
		return;
	}
	if (!node || typeof node !== 'object') {
		return;
	}
	const record = node as Record<string, unknown>;

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
