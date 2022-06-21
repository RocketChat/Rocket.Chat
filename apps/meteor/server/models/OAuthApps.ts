import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { OAuthAppsRaw } from './raw/OAuthApps';

const col = db.collection(`${prefix}oauth_apps`);
registerModel('IOAuthAppsModel', new OAuthAppsRaw(col, trashCollection));
