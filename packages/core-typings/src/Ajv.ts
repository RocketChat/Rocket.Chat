import typia from 'typia';

import type { IInvite } from './IInvite';
import type { ISubscription } from './ISubscription';

export const schemas = typia.json.schemas<[ISubscription | IInvite], '3.0'>();
