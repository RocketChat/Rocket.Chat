import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { FederationKeysRaw } from './raw/FederationKeys';

registerModel('IFederationKeysModel', new FederationKeysRaw(db, trashCollection));
