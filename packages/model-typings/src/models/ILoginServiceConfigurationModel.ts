import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ILoginServiceConfigurationModel extends IBaseModel<LoginServiceConfiguration> {
	createOrUpdateService(
		serviceName: LoginServiceConfiguration['service'],
		serviceData: Partial<LoginServiceConfiguration>,
	): Promise<LoginServiceConfiguration['_id']>;
	removeByService(serviceName: LoginServiceConfiguration['service']): Promise<Pick<LoginServiceConfiguration, '_id'> | null>;
	findOneByService<P extends Document = LoginServiceConfiguration, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		serviceName: LoginServiceConfiguration['service'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
}
