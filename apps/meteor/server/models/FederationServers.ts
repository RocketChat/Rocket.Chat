import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { FederationServersRaw } from './raw/FederationServers';

registerModel('IFederationServersModel', new FederationServersRaw(db, trashCollection));
