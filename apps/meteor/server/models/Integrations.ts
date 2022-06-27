import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { IntegrationsRaw } from './raw/Integrations';

registerModel('IIntegrationsModel', new IntegrationsRaw(db, trashCollection));
