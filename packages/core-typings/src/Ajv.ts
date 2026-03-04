import typia from 'typia';

import type { CallHistoryItem } from './ICallHistoryItem';
import type { ICustomSound } from './ICustomSound';
import type { ICustomUserStatus } from './ICustomUserStatus';
import type { IInvite } from './IInvite';
import type { IMessage } from './IMessage';
import type { IOAuthApps } from './IOAuthApps';
import type { IPermission } from './IPermission';
import type { IRoom } from './IRoom';
import type { ISubscription } from './ISubscription';
import type { IUser } from './IUser';
import type { SlashCommand } from './SlashCommands';
import type { IMediaCall } from './mediaCalls/IMediaCall';

export const schemas = typia.json.schemas<
	[
		ISubscription | IInvite | ICustomSound | IMessage | IOAuthApps | IPermission | IMediaCall | IRoom | IUser,
		CallHistoryItem,
		ICustomUserStatus,
		SlashCommand,
	],
	'3.0'
>();
