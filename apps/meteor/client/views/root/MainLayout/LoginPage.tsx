import { useSession } from '@rocket.chat/ui-contexts';
import type { LoginRoutes } from '@rocket.chat/web-ui-registration';
import RegistrationRoute from '@rocket.chat/web-ui-registration';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useIframeLogin } from './useIframeLogin';
import LoggedOutBanner from '../../../components/deviceManagement/LoggedOutBanner';

const LoginPage = ({ defaultRoute, children }: { defaultRoute?: LoginRoutes; children?: ReactNode }): ReactElement => {
	const { t } = useTranslation();
	const showForcedLogoutBanner = useSession('force_logout') as boolean | undefined;
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
