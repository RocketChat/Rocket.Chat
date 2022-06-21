import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { WebdavAccountsRaw } from './raw/WebdavAccounts';

const col = db.collection(`${prefix}webdav_accounts`);
registerModel('IWebdavAccountsModel', new WebdavAccountsRaw(col, trashCollection));
