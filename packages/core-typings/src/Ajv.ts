import typia from 'typia';

import type { ICustomSound } from './ICustomSound';
import type { ICustomUserStatus } from './ICustomUserStatus';
import type { IInvite } from './IInvite';
import type { IMessage } from './IMessage';
import type { IOAuthApps } from './IOAuthApps';
import type { IPermission } from './IPermission';
import type { ISubscription } from './ISubscription';

export const schemas = typia.json.schemas<
	[ISubscription | IInvite | ICustomSound | IMessage | IOAuthApps | IPermission | ICustomUserStatus],
	'3.0'
>();
