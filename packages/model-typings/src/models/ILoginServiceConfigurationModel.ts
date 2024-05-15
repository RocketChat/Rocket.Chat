import type { LoginServiceConfiguration, ILoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { DeleteResult, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILoginServiceConfigurationModel extends IBaseModel<LoginServiceConfiguration> {
	createOrUpdateService(
		serviceName: LoginServiceConfiguration['service'],
		serviceData: Partial<LoginServiceConfiguration>,
	): Promise<LoginServiceConfiguration['_id']>;
	removeService(_id: LoginServiceConfiguration['_id']): Promise<DeleteResult>;
	findOneByService(serviceName: LoginServiceConfiguration['service'], options?: FindOptions<ILoginServiceConfiguration>): Promise<LoginServiceConfiguration | null>;
}
