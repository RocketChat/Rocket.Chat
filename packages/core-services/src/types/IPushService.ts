import type { IPushToken, Optional } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IPushService extends IServiceClass {
	registerPushToken(
		data: Optional<Pick<IPushToken, '_id' | 'token' | 'authToken' | 'appName' | 'userId' | 'metadata'>, '_id' | 'metadata'>,
	): Promise<Omit<IPushToken, 'authToken'>>;
}
