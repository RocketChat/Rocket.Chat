import { Callout } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import VerticalTemplate from './template/VerticalTemplate';

const SecretRegisterInvalidForm = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<VerticalTemplate>
			<Callout role='status' type='warning'>
				{t('Invalid_secret_URL_message')}
			</Callout>
		</VerticalTemplate>
	);
};

export default SecretRegisterInvalidForm;
