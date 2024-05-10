import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILoginServiceConfigurationModel extends IBaseModel<LoginServiceConfiguration> {
	createOrUpdateService(serviceName: string, serviceData: Partial<LoginServiceConfiguration>): Promise<LoginServiceConfiguration['_id']>;
	removeService(serviceName: string): Promise<DeleteResult>;
}
