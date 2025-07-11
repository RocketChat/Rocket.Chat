import typia from 'typia';

import type { ISubscription } from './ISubscription';

export const schemas = typia.json.schemas<[ISubscription], '3.0'>();
