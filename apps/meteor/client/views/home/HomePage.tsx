import { useRouter, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { KonchatNotification } from '../../../app/ui/client/lib/KonchatNotification';
import CustomHomePage from './CustomHomePage';
import DefaultHomePage from './DefaultHomePage';

const HomePage = (): ReactElement => {
	useEffect(() => {
		KonchatNotification.getDesktopPermission();
	}, []);

	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		const { saml_idp_credentialToken: token, ...search } = router.getSearchParameters();
		if (!token) {
			return;
		}

		Meteor.loginWithSamlToken(token, (error?: unknown) => {
			if (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			router.navigate(
				{
					pathname: router.getLocationPathname(),
					search,
				},
				{ replace: true },
			);
		});
	}, [dispatchToastMessage, router]);

	const customOnly = useSetting('Layout_Custom_Body_Only');

	if (customOnly) {
		return <CustomHomePage />;
	}

	return <DefaultHomePage />;
};

export default HomePage;
