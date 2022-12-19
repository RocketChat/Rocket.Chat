import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import VerticalTemplate from './template/VerticalTemplate';

const SecretRegisterInvalidForm = (): ReactElement => {
	const t = useTranslation();

	return <VerticalTemplate>{t('Invalid_secret_URL_message')}</VerticalTemplate>;
};

export default SecretRegisterInvalidForm;
