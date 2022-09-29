import { useQueryStringParameter, useRoute, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect } from 'react';

import { KonchatNotification } from '../../../app/ui';
import CustomHomePage from './CustomHomePage';
import DefaultHomePage from './DefaultHomePage';

const HomePage = (): ReactElement => {
	useEffect(() => {
		KonchatNotification.getDesktopPermission();
	}, []);

	const samlIdpCredentialToken = useQueryStringParameter('saml_idp_credentialToken');
	const dispatchToastMessage = useToastMessageDispatch();
	const homeRoute = useRoute('home');

	useEffect(() => {
		if (!samlIdpCredentialToken) {
			return;
		}

		(Meteor as any).loginWithSamlToken(samlIdpCredentialToken, (error?: unknown) => {
			if (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			homeRoute.push();
		});
	}, [dispatchToastMessage, homeRoute, samlIdpCredentialToken]);

	const customOnly = useSetting('Layout_Custom_Body_Only');

	if (customOnly) {
		return <CustomHomePage />;
	}

	return <DefaultHomePage />;
};

export default HomePage;
