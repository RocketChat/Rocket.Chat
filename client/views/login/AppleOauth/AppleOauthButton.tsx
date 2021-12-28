import { Accounts } from 'meteor/accounts-base';
import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
// import { createPortal } from 'react-dom';

import { useAbsoluteUrl } from '../../../contexts/ServerContext';
import { useSetting } from '../../../contexts/SettingsContext';

export const AppleOauthButton = (): ReactNode => {
	const enabled = useSetting('Accounts_OAuth_Apple');
	const absoluteUrl = useAbsoluteUrl();
	const appleClientID = useSetting('Accounts_OAuth_Apple_id') || '[CLIENT_ID]';

	const redirectURI = absoluteUrl('_oauth/apple');

	useEffect(() => {
		document.addEventListener('AppleIDSignInOnSuccess', (data) => {
			// handle successful response
			const { authorization, user } = data.detail;

			Accounts.callLoginMethod({
				methodArguments: [
					{
						serviceName: 'apple',
						identityToken: authorization.id_token,
						...(user && {
							fullName: {
								givenName: user.name.firstName,
								familyName: user.name.lastName,
							},
							email: user.email,
						}),
					},
				],
				userCallback: console.log,
			});
		});
		// Listen for authorization failures
		document.addEventListener('AppleIDSignInOnFailure', (error) => {
			// handle error.
			console.error('deu ruim', error);
		});
	}, []);

	const scriptLoadedHandler = useCallback(() => {
		if (!enabled) {
			return;
		}
		(window as any).AppleID.auth.init({
			clientId: appleClientID,
			scope: 'name email',
			redirectURI,
			usePopup: true,
		});
	}, [enabled, appleClientID, redirectURI]);

	const ref = useRef<HTMLScriptElement>(null);

	useEffect(() => {
		if ((window as any).AppleID) {
			scriptLoadedHandler();
			return;
		}
		if (!ref.current) {
			return;
		}
		ref.current.onload = scriptLoadedHandler;
	}, [scriptLoadedHandler]);

	if (!enabled) {
		return null;
	}

	const script = document.createElement('script');
	script.src =
		'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
	script.async = true;
	script.onload = scriptLoadedHandler;
	document.body.appendChild(script);

	return (
		<>
			{/* {createPortal(
				<script
					id='apple-id-script'
					ref={ref}
					// async
					src='https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
				/>,
				document.body,
			)} */}
			<div id='appleid-signin' data-height='40px'></div>
		</>
	);
};

export default AppleOauthButton;
