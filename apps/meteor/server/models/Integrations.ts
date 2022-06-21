import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { IntegrationsRaw } from './raw/Integrations';

const col = db.collection(`${prefix}integrations`);
export const Integrations = new IntegrationsRaw(col, trashCollection);
registerModel('IIntegrationsModel', Integrations);
