import { Meteor } from 'meteor/meteor';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IAccessToken, ICloudService } from '@rocket.chat/core-services';

import { getWorkspaceAccessTokenWithScope } from '../../../app/cloud/server';

export class CloudService extends ServiceClassInternal implements ICloudService {
	protected name = 'cloud';

	getWorkspaceAccessTokenWithScope(scope?: string): IAccessToken {
		const boundGetWorkspaceAccessToken = Meteor.bindEnvironment(getWorkspaceAccessTokenWithScope);
		return boundGetWorkspaceAccessToken(scope);
	}
}
