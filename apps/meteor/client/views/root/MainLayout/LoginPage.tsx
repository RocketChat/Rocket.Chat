import { useSession } from '@rocket.chat/ui-contexts';
import RegistrationRoute from '@rocket.chat/web-ui-registration';
import type { ReactElement } from 'react';
import React from 'react';

import LoggedOutBanner from '../../../../ee/client/components/deviceManagement/LoggedOutBanner';
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
			<RegistrationRoute />
		</>
	);
};

export default LoginPage;
