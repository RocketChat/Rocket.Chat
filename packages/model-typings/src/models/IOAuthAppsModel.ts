import type { IOAuthApps } from '@rocket.chat/core-typings';
import type { Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IOAuthAppsModel extends IBaseModel<IOAuthApps> {
	findOneAuthAppByIdOrClientId<T extends Document = IOAuthApps, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		props:
			| { clientId: string }
			| { appId: string }
			| {
					_id: string;
			  },
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findOneActiveByClientId<T extends Document = IOAuthApps, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		clientId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	updateById(
		_id: IOAuthApps['_id'],
		data: Partial<Pick<IOAuthApps, 'name' | 'active' | 'redirectUri' | '_updatedBy'>>,
	): Promise<IOAuthApps | null>;

	findOneActiveByClientIdAndClientSecret<
		T extends Document = IOAuthApps,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		clientId: string,
		clientSecret: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
}
