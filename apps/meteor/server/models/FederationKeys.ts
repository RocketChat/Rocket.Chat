import { registerModel } from '@rocket.chat/models';
import type { IFederationKeysModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { FederationKeysRaw } from './raw/FederationKeys';

const col = db.collection(`${prefix}federation_keys`);
registerModel('IFederationKeysModel', new FederationKeysRaw(col, trashCollection) as IFederationKeysModel);
