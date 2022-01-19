import { Accounts } from 'meteor/accounts-base';
import React, { FC, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { useAbsoluteUrl } from '../../../contexts/ServerContext';
import { useSetting } from '../../../contexts/SettingsContext';

export const AppleOauthButton: FC = () => {
	const enabled = useSetting('Accounts_OAuth_Apple');
	const absoluteUrl = useAbsoluteUrl();
	const appleClientID = useSetting('Accounts_OAuth_Apple_id');

	const redirectURI = absoluteUrl('_oauth/apple');

	useEffect(() => {
		const success = (data: any): void => {
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
		};

		const error = (error: any): void => {
			// handle error.
			console.error(error);
		};
		document.addEventListener('AppleIDSignInOnSuccess', success);
		// Listen for authorization failures
		document.addEventListener('AppleIDSignInOnFailure', error);

		return (): void => {
			document.removeEventListener('AppleIDSignInOnSuccess', success);
			document.removeEventListener('AppleIDSignInOnFailure', error);
		};
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

	const ref = useRef<HTMLScriptElement>();

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

	useLayoutEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
		script.async = true;
		ref.current = script;
		document.body.appendChild(script);
		return (): void => {
			document.body.removeChild(script);
		};
	}, []);

	if (!enabled) {
		return null;
	}

	return <div id='appleid-signin' data-height='40px'></div>;
};

export default AppleOauthButton;
