import { Meteor } from 'meteor/meteor';

import { sdk } from '../../utils/client/lib/SDKClient';
import { AuthorizationUtils } from '../lib';

Meteor.startup(async () => {
	const result = await sdk.call('license:isEnterprise');
	if (result) {
		// #ToDo: Load this from the server with an API call instead of having a duplicate list
		AuthorizationUtils.addRolePermissionWhiteList('guest', [
			'view-d-room',
			'view-joined-room',
			'view-p-room',
			'start-discussion',
			'mobile-upload-file',
		]);
	}
});
