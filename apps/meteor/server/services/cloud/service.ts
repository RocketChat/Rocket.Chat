import { Meteor } from 'meteor/meteor';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IAccessToken, ICloudService } from '../../sdk/types/ICloudService';
import { getWorkspaceAccessTokenWithScope } from '../../../app/cloud/server';

export class CloudService extends ServiceClassInternal implements ICloudService {
	protected name = 'cloud';

	getWorkspaceAccessTokenWithScope(scope?: string): IAccessToken {
		const boundGetWorkspaceAccessToken = Meteor.bindEnvironment(getWorkspaceAccessTokenWithScope);
		return boundGetWorkspaceAccessToken(scope);
	}
}
