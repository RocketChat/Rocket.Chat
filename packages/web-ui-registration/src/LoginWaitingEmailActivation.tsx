import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

export const LoginWaitingEmailActivation = (): ReactElement => {
	const t = useTranslation();
	return (
		<>
			<header>
				<h2 data-i18n='Registration_Succeeded'>{t('Registration_Succeeded')}</h2>
				<p>{t('We_have_sent_registration_email')}</p>
			</header>
		</>
	);
};

export default LoginWaitingEmailActivation;
