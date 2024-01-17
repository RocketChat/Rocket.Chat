import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { WebdavAccountsRaw } from './raw/WebdavAccounts';

registerModel('IWebdavAccountsModel', new WebdavAccountsRaw(db));
