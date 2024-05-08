import { registerModel } from '@rocket.chat/models';

import { FederationServersRaw } from './raw/FederationServers';

registerModel('IFederationServersModel', new FederationServersRaw());
