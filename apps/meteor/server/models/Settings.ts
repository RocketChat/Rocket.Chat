import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { SettingsRaw } from './raw/Settings';

registerModel('ISettingsModel', new SettingsRaw(db, trashCollection));
