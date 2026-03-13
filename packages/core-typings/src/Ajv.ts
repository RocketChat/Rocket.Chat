import typia from 'typia';

import type { IBanner } from './IBanner';
import type { ICalendarEvent } from './ICalendarEvent';
import type { CallHistoryItem } from './ICallHistoryItem';
import type { CloudConfirmationPollData, CloudRegistrationIntentData, CloudRegistrationStatus } from './ICloud';
import type { ICustomSound } from './ICustomSound';
import type { ICustomUserStatus } from './ICustomUserStatus';
import type { IEmailInbox } from './IEmailInbox';
import type { IInvite } from './IInvite';
import type { IMessage } from './IMessage';
import type { IModerationAudit, IModerationReport } from './IModerationReport';
import type { IOAuthApps } from './IOAuthApps';
import type { IPermission } from './IPermission';
import type { IRole } from './IRole';
import type { IRoom, IDirectoryChannelResult } from './IRoom';
import type { ISubscription } from './ISubscription';
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
			| IMessage
			| IOAuthApps
			| IPermission
			| IMediaCall
			| IEmailInbox
			| IImport
			| ICalendarEvent
			| IRole
			| IRoom
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
		),
		CallHistoryItem,
		ICustomUserStatus,
		SlashCommand,
	],
	'3.0'
>();
