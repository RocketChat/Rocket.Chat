import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILoginServiceConfigurationModel extends IBaseModel<LoginServiceConfiguration> {
	createOrUpdateService(serviceName: LoginServiceConfiguration['service'], serviceData: Partial<LoginServiceConfiguration>): Promise<LoginServiceConfiguration['_id']>;
	removeService(serviceName: LoginServiceConfiguration['service']): Promise<DeleteResult>;
	findOneByService(serviceName: LoginServiceConfiguration['service']): Promise<LoginServiceConfiguration | null>;
}
