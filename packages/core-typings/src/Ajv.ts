import typia from 'typia';

import type { ICalendarEvent } from './ICalendarEvent';
import type { CallHistoryItem } from './ICallHistoryItem';
import type { ICustomSound } from './ICustomSound';
import type { ICustomUserStatus } from './ICustomUserStatus';
import type { IEmailInbox } from './IEmailInbox';
import type { IInvite } from './IInvite';
import type { IMessage } from './IMessage';
import type { IOAuthApps } from './IOAuthApps';
import type { IPermission } from './IPermission';
import type { ISubscription } from './ISubscription';
import type { SlashCommand } from './SlashCommands';
import type { IMediaCall } from './mediaCalls/IMediaCall';

export const schemas = typia.json.schemas<
	[
		ISubscription | IInvite | ICustomSound | IMessage | IOAuthApps | IPermission | IMediaCall | IEmailInbox | ICalendarEvent,
		CallHistoryItem,
		ICustomUserStatus,
		SlashCommand,
	],
	'3.0'
>();
