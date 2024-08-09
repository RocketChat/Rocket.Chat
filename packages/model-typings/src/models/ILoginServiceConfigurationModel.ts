import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { DeleteResult, Document, FindOptions, ModifyResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILoginServiceConfigurationModel extends IBaseModel<LoginServiceConfiguration> {
	createOrUpdateService(
		serviceName: LoginServiceConfiguration['service'],
		serviceData: Partial<LoginServiceConfiguration>,
	): Promise<{ operation: 'created' | 'updated' | 'no-op'; result: ModifyResult<LoginServiceConfiguration> }>;
	removeService(_id: LoginServiceConfiguration['_id']): Promise<DeleteResult>;
	findOneByService<P extends Document = LoginServiceConfiguration>(
		serviceName: LoginServiceConfiguration['service'],
		options?: FindOptions<P>,
	): Promise<P | null>;
}
