import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { AppsRaw } from './raw/Apps';

registerModel('IAppsModel', new AppsRaw(db, trashCollection));
