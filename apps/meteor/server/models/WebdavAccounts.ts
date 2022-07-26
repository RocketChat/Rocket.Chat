import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { WebdavAccountsRaw } from './raw/WebdavAccounts';

registerModel('IWebdavAccountsModel', new WebdavAccountsRaw(db, trashCollection));
