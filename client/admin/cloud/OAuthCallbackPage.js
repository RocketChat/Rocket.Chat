import React, { useState, useEffect } from 'react';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useQueryStringParameter, useRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';

function OAuthCallbackPage() {
	const t = useTranslation();

	const [callbackError, setCallbackError] = useState({ error: false });

	const errorCode = useQueryStringParameter('error_code');
	const code = useQueryStringParameter('code');
	const state = useQueryStringParameter('state');

	const finishOAuthAuthorization = useMethod('cloud:finishOAuthAuthorization');
	const cloudRoute = useRoute('cloud');

	useEffect(() => {
		if (errorCode) {
			setCallbackError({ error: true, errorCode });
		} else {
			finishOAuthAuthorization(code, state)
				.then(() => {
					cloudRoute.push();
				})
				.catch((error) => {
					console.warn('cloud:finishOAuthAuthorization', error);
				});
		}
	}, [errorCode, code, state]);

	return <Page>
		<Page.Header title={t('Cloud_connect')} />
		<Page.ScrollableContentWithShadow>
			{callbackError?.error && <>
				<p>{t('Cloud_error_in_authenticating')}</p>

				<p>{t('Cloud_error_code')} {callbackError?.errorCode}</p>
			</>}
		</Page.ScrollableContentWithShadow>
	</Page>;
}

export default OAuthCallbackPage;
