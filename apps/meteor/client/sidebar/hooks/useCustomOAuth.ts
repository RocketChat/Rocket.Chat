import { useEffect } from 'react';

import { CustomOAuth } from '../../lib/customOAuth/CustomOAuth';
import { loginServices } from '../../lib/loginServices';

export const useCustomOAuth = () => {
	useEffect(
		() =>
			loginServices.onLoad((services) => {
				for (const service of services) {
					if (!('custom' in service && service.custom)) {
						continue;
					}

					CustomOAuth.configureCustomOAuthService(service.service, {
						serverURL: service.serverURL,
						authorizePath: service.authorizePath,
						scope: service.scope,
					});
				}
			}),
		[],
	);
};
