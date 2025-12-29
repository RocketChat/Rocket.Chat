import typia from 'typia';

import type { CallHistoryItem } from './ICallHistoryItem';
import type { ICustomSound } from './ICustomSound';
import type { IInvite } from './IInvite';
import type { IMessage as _IMessage } from './IMessage';
import type { IOAuthApps } from './IOAuthApps';
import type { IPermission as _IPermission } from './IPermission';
import type { ISubscription as _ISubscription } from './ISubscription';
import type { IMediaCall } from './mediaCalls/IMediaCall';

// Workaround for typia issue
type IMessage = Pick<_IMessage, '_id'>;
type ISubscription = Pick<_ISubscription, '_id'>;
type IPermission = Pick<_IPermission, '_updatedAt'>;

export const schemas = typia.json.schemas<
	[ISubscription | IInvite | ICustomSound | IMessage | IOAuthApps | IPermission | IMediaCall, CallHistoryItem],
	'3.0'
>();
