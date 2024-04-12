import { registerModel } from '@rocket.chat/models';

import { FederationKeysRaw } from './raw/FederationKeys';

registerModel('IFederationKeysModel', new FederationKeysRaw());
