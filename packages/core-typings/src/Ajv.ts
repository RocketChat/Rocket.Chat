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
 */
const toDraft2020 = <T>(node: T): T => {
	if (Array.isArray(node)) {
		return node.map(toDraft2020) as T;
	}

	if (!node || typeof node !== 'object') {
		return node;
	}

	const entries = Object.entries(node).map(([key, value]) => [key === 'additionalItems' ? 'items' : key, toDraft2020(value)]);
	const schema = Object.fromEntries(entries) as Record<string, unknown>;

	if (Array.isArray(schema.prefixItems) && schema.items === false && schema.minItems === undefined) {
		schema.minItems = schema.prefixItems.length;
	}

	return schema as T;
};

export const schemas = toDraft2020(generatedSchemas);
