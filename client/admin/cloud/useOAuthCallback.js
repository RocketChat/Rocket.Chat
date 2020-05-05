import { useEffect } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useQueryStringParameter, useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { usePermission } from '../../contexts/AuthorizationContext';

export const useOAuthCallback = () => {
	const canManageCloud = usePermission('manage-cloud');
	const page = useRouteParameter('page');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const errorCode = useQueryStringParameter('error_code');
	const code = useQueryStringParameter('code');
	const state = useQueryStringParameter('state');

	const finishOAuthAuthorization = useMethod('cloud:finishOAuthAuthorization');
	const cloudRoute = useRoute('cloud');

	useEffect(() => {
		const acceptOAuthAuthorization = async () => {
			if (!canManageCloud || page !== 'oauth-callback') {
				return;
			}

			if (errorCode) {
				dispatchToastMessage({
					type: 'error',
					title: t('Cloud_error_in_authenticating'),
					message: t('Cloud_error_code', { errorCode }),
				});
				cloudRoute.push();
				return;
			}

			try {
				await finishOAuthAuthorization(code, state);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				cloudRoute.push();
			}
		};

		acceptOAuthAuthorization();
	}, [errorCode, code, state]);
};
