import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { IntegrationsRaw } from './raw/Integrations';

registerModel('IIntegrationsModel', new IntegrationsRaw(db));
