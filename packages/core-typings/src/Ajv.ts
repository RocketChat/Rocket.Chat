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
import type { IOAuthApps } from './IOAuthApps';
import type { IPermission } from './IPermission';
import type { IRole } from './IRole';
import type { IRoom } from './IRoom';
import type { ISubscription } from './ISubscription';
import type { VideoConference, VideoConferenceInstructions } from './IVideoConference';
import type { IUser } from './IUser';
import type { SlashCommand } from './SlashCommands';
import type { VideoConferenceCapabilities } from './VideoConferenceCapabilities';
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
			| ICalendarEvent
			| IRole
			| IRoom
			| IUser
			| VideoConference
			| VideoConferenceCapabilities
			| VideoConferenceInstructions
			| CloudConfirmationPollData
			| CloudRegistrationIntentData
			| CloudRegistrationStatus
			| IBanner
		),
		CallHistoryItem,
		ICustomUserStatus,
		SlashCommand,
	],
	'3.0'
>();
