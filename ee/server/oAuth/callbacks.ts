import { capitalize } from '@rocket.chat/string-helpers';

import { EnterpriseOAuthHelpers } from './helpers';
import { onLicense } from '../../app/license/server';
import { callbacks } from '../../../app/callbacks/server';
import { settings } from '../../../app/settings/server';
import { Logger } from '../../../app/logger/server';

interface IProcessEEOAuthUser {
	serviceName: string;
	serviceData: Record<string, any>;
	user: Record<string, any>;
}

// TODO: rename auth to something meaningful
onLicense('oAuth-enterprise', (auth: IProcessEEOAuthUser) => {
	callbacks.add('beforeProcessOAuthUser', () => {
		const logger = new Logger('EECustomOAuth');
		auth.serviceName = capitalize(auth.serviceName);

		const mapChannels = settings.get(`Accounts_OAuth_Custom-${ auth.serviceName }-map_channels`);
		const mergeRoles = settings.get(`Accounts_OAuth_Custom-${ auth.serviceName }-merge_roles`);
		const rolesClaim = settings.get(`Accounts_OAuth_Custom-${ auth.serviceName }-roles_claim`);
		const groupsClaim = settings.get(`Accounts_OAuth_Custom-${ auth.serviceName }-groups_claim`);
		const channelsAdmin = settings.get(`Accounts_OAuth_Custom-${ auth.serviceName }-channels_admin`);


		let channelsMap;

		if (mapChannels) {
			channelsMap = settings.get(`Accounts_OAuth_Custom-${ auth.serviceName }-channels_map`) as string;
			channelsMap = (channelsMap || '{}').trim();
			console.log(channelsMap, mergeRoles);

			try {
				channelsMap = JSON.parse(channelsMap);
			} catch (err) {
				logger.error(`Unexpected error : ${ err }`);
			}
		}

		if (mergeRoles) {
			EnterpriseOAuthHelpers.updateRolesFromSSO(auth.user, auth.serviceData, rolesClaim);
		}

		if (mapChannels) {
			EnterpriseOAuthHelpers.mapSSOGroupsToChannels(auth.user, auth.serviceData, groupsClaim, channelsMap, channelsAdmin);
		}
	});
});
