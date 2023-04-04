import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { FederationKeysRaw } from './raw/FederationKeys';

registerModel('IFederationKeysModel', new FederationKeysRaw(db));
