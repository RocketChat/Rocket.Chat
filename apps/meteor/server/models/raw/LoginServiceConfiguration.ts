import type { LoginServiceConfiguration, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILoginServiceConfigurationModel } from '@rocket.chat/model-typings';
import type { Collection, Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LoginServiceConfigurationRaw extends BaseRaw<LoginServiceConfiguration> implements ILoginServiceConfigurationModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<LoginServiceConfiguration>>) {
		super(db, 'meteor_accounts_loginServiceConfiguration', trash, {
			preventSetUpdatedAt: true,
			collectionNameResolver(name) {
				return name;
			},
		});
	}
}
