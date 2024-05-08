import { registerModel } from '@rocket.chat/models';

import { IntegrationsRaw } from './raw/Integrations';

registerModel('IIntegrationsModel', new IntegrationsRaw());
