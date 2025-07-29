import typia from 'typia';

import type { ICustomSound } from './ICustomSound';
import type { IInvite } from './IInvite';
import type { IMessage } from './IMessage';
import type { ISubscription } from './ISubscription';

export const schemas = typia.json.schemas<[ISubscription | IInvite | ICustomSound | IMessage], '3.0'>();
