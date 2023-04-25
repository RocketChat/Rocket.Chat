import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import VerticalTemplate from './template/VerticalTemplate';

const SecretRegisterInvalidForm = (): ReactElement => {
	const t = useTranslation();

	return (
		<VerticalTemplate>
			<h2>{t('Invalid_secret_URL_message')}</h2>
		</VerticalTemplate>
	);
};

export default SecretRegisterInvalidForm;
