import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { FlowRouter } from 'meteor/kadira:flow-router';
import toastr from 'toastr';

import { hasAllPermission } from '../../authorization/client';
import { APIClient } from '../../utils/client';

export async function getIntegration(integrationId, uid) {
	if (!integrationId) {
		return;
	}

	const reqParams = {
		integrationId,
	};

	if (!hasAllPermission('manage-outgoing-integrations')) {
		if (!hasAllPermission('manage-own-outgoing-integrations')) {
			toastr.error(TAPi18n.__('No_integration_found'));
			FlowRouter.go('admin-integrations');
			return;
		}
		reqParams.createdBy = uid;
	}

	try {
		const { integration } = await APIClient.v1.get('integrations.get', reqParams);

		return integration;
	} catch (e) {
		toastr.error(TAPi18n.__('Error'));
		console.error(e);
	}
}
