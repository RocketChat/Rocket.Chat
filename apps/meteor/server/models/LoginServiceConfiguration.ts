import type { ILoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { ILoginServiceConfigurationModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db } from '../database/utils';

export class LoginServiceConfiguration extends ModelClass<ILoginServiceConfiguration> implements ILoginServiceConfigurationModel {}

const col = db.collection('meteor_accounts_loginServiceConfiguration');
registerModel(
	'ILoginServiceConfigurationModel',
	new LoginServiceConfiguration(col, trashCollection, { preventSetUpdatedAt: true }) as ILoginServiceConfigurationModel,
);
