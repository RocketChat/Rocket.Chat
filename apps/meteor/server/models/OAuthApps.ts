import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { OAuthAppsRaw } from './raw/OAuthApps';

registerModel('IOAuthAppsModel', new OAuthAppsRaw(db, trashCollection));
