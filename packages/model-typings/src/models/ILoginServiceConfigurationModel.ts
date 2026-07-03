import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { Document, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILoginServiceConfigurationModel extends IBaseModel<LoginServiceConfiguration> {
	createOrUpdateService(
		serviceName: LoginServiceConfiguration['service'],
		serviceData: Partial<LoginServiceConfiguration>,
	): Promise<LoginServiceConfiguration['_id']>;
	removeByService(serviceName: LoginServiceConfiguration['service']): Promise<Pick<LoginServiceConfiguration, '_id'> | null>;
	findOneByService<P extends Document = LoginServiceConfiguration>(
		serviceName: LoginServiceConfiguration['service'],
		options?: FindOptions<P>,
	): Promise<P | null>;
}
