import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { SettingsRaw } from './raw/Settings';

registerModel('ISettingsModel', new SettingsRaw(trashCollection));
