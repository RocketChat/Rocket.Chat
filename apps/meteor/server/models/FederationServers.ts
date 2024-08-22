import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { FederationServersRaw } from './raw/FederationServers';

registerModel('IFederationServersModel', new FederationServersRaw(db));
