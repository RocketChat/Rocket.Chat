import typia from 'typia';

import type { CallHistoryItem } from './ICallHistoryItem';
import type { ICustomSound } from './ICustomSound';
import type { ICustomUserStatus } from './ICustomUserStatus';
import type { IInvite } from './IInvite';
import type { IMessage } from './IMessage';
import type { IOAuthApps } from './IOAuthApps';
import type { IPermission } from './IPermission';
import type { ISubscription } from './ISubscription';
import type { SlashCommand } from './SlashCommands';
import type { IMediaCall } from './mediaCalls/IMediaCall';
import type { IUser } from "./IUser";
import type { IMeResponse } from '../../../apps/meteor/app/api/server/v1/misc';

export const schemas = typia.json.schemas<
	[
		ISubscription | IInvite | ICustomSound | IMessage | IOAuthApps | IPermission | IMediaCall,
		CallHistoryItem,
		ICustomUserStatus,
		SlashCommand,
		IUser,
		IMeResponse
	],
	'3.0'
>();
