import { useSession, useTranslation } from '@rocket.chat/ui-contexts';
import type { LoginRoutes } from '@rocket.chat/web-ui-registration';
import RegistrationRoute from '@rocket.chat/web-ui-registration';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import LoggedOutBanner from '../../../components/deviceManagement/LoggedOutBanner';
import { useIframeLogin } from './useIframeLogin';

const LoginPage = ({ defaultRoute, children }: { defaultRoute?: LoginRoutes; children?: ReactNode }): ReactElement => {
	const t = useTranslation();
	const showForcedLogoutBanner = useSession('force_logout');
	const iframeLoginUrl = useIframeLogin();

	if (iframeLoginUrl) {
		return <iframe title={t('Login')} src={iframeLoginUrl} style={{ height: '100%', width: '100%' }} />;
	}

	return (
		<>
			{showForcedLogoutBanner && <LoggedOutBanner />}
			<RegistrationRoute defaultRoute={defaultRoute} children={children} />
		</>
	);
};

export default LoginPage;
