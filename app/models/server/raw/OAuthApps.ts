import { IOAuthApps as T } from '../../../../definition/IOAuthApps';
import { BaseRaw } from './BaseRaw';

export class OAuthAppsRaw extends BaseRaw<T> {
	findOneAuthAppByIdOrClientId({ clientId, appId }: { clientId: string; appId: string }): ReturnType<BaseRaw<T>['findOne']> {
		return this.findOne({
			...(appId && { _id: appId }),
			...(clientId && { clientId }),
		});
	}
}
