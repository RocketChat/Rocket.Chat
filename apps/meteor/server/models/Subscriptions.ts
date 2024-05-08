import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { SubscriptionsRaw } from './raw/Subscriptions';

registerModel('ISubscriptionsModel', new SubscriptionsRaw(trashCollection));
