import React, { ReactNode, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useAbsoluteUrl } from '../../../contexts/ServerContext';
import { useSetting } from '../../../contexts/SettingsContext';

export const AppleOauthButton = (): ReactNode => {
	const enabled = useSetting('Accounts_OAuth_Apple');
	const absoluteUrl = useAbsoluteUrl();
	const appleClientID = useSetting('Accounts_OAuth_Apple_client_id') || '[CLIENT_ID]';
	const appleState = useSetting('Accounts_OAuth_Apple_state');

	const appleRedirectUri = useSetting('Accounts_OAuth_Apple_redirectUri');
	const defaultRedirectURI = absoluteUrl('_oauth/apple');
	const redirectURI = appleRedirectUri || defaultRedirectURI;

	const scriptLoadedHandler = useCallback(() => {
		if (!enabled) {
			return;
		}
		(window as any).AppleID.auth.init({
			clientId: appleClientID,
			scope: 'name email',
			redirectURI,
			state:
				appleState ||
				btoa(
					JSON.stringify({
						loginStyle: 'redirect',
						redirectUrl: location.href,
					}),
				),
		});
	}, [enabled, appleClientID, redirectURI, appleState]);

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

	useLayoutEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
		script.async = true;
		ref.current = script;
		document.body.appendChild(script);
		return () => {
			document.body.removeChild(script);
		};
	}, []);

	if (!enabled) {
		return null;
	}
	return (
		<>
			<div id='appleid-signin' data-height='40px'></div>
		</>
	);
};

export default AppleOauthButton;
