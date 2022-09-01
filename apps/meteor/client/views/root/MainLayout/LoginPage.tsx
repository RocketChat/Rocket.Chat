import { useSession } from '@rocket.chat/ui-contexts';
import RegistrationRoute from '@rocket.chat/web-ui-registration';
import React, { ReactElement } from 'react';

import LoggedOutBanner from '../../../../ee/client/components/deviceManagement/LoggedOutBanner';
import RegistrationI18nProvider from '../providers/RegistrationI18nProvider';
import { useIframeLogin } from './useIframeLogin';

const LoginPage = (): ReactElement => {
	const showForcedLogoutBanner = useSession('force_logout');
	const iframeLoginUrl = useIframeLogin();

	if (iframeLoginUrl) {
		return <iframe src={iframeLoginUrl} style={{ height: '100%', width: '100%' }} />;
	}

	return (
		<>
			{showForcedLogoutBanner && <LoggedOutBanner />}
			<RegistrationI18nProvider>
				<RegistrationRoute />
			</RegistrationI18nProvider>
		</>
	);
};

export default LoginPage;
