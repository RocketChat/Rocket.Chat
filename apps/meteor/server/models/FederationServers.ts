import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { FederationServersRaw } from './raw/FederationServers';

const col = db.collection(`${prefix}federation_servers`);
registerModel('IFederationServersModel', new FederationServersRaw(col, trashCollection));
