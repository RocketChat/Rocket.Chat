import { registerModel } from '@rocket.chat/models';
import type { IIntegrationsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { IntegrationsRaw } from './raw/Integrations';

const col = db.collection(`${prefix}integrations`);
export const Integrations = new IntegrationsRaw(col, trashCollection);
registerModel('IIntegrationsModel', Integrations as IIntegrationsModel);
