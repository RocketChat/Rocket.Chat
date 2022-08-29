import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const LoginWaitingActivation = (): ReactElement => {
	const t = useTranslation();
	return (
		<>
			<header>
				<h2 data-i18n='Registration_Succeeded'>{t('Registration_Succeeded')}</h2>
				<p>{t('Wait_activation_warning')}</p>
				<p>{t('Please_wait_activation')}</p>
			</header>
		</>
	);
};

export default LoginWaitingActivation;
