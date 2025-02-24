import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ErrorPage from './components/ErrorPage';

const OAuthErrorPage = () => {
	const errorType = useRouteParameter('error');
	const { t } = useTranslation();

	switch (errorType) {
		case '404':
			return <ErrorPage error={t('core.Invalid_OAuth_client')} />;
		case 'invalid_redirect_uri':
			return <ErrorPage error={t('core.Redirect_URL_does_not_match')} />;
		default:
			return <ErrorPage error={t('core.Error_something_went_wrong')} />;
	}
};

export default OAuthErrorPage;
