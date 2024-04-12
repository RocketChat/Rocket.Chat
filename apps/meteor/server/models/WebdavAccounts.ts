import { registerModel } from '@rocket.chat/models';

import { WebdavAccountsRaw } from './raw/WebdavAccounts';

registerModel('IWebdavAccountsModel', new WebdavAccountsRaw());
