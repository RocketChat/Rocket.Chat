import { registerModel } from '@rocket.chat/models';
import type { ISettingsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/Settings';
import { SettingsRaw } from './raw/Settings';

const col = MeteorModel.model.rawCollection();
export const Settings = new SettingsRaw(col, trashCollection);
registerModel('ISettingsModel', Settings as ISettingsModel);
