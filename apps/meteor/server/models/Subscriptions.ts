import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { SubscriptionsRaw } from './raw/Subscriptions';

registerModel('ISubscriptionsModel', new SubscriptionsRaw(db, trashCollection));
