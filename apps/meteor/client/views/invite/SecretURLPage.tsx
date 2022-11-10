import { useUserId, useRoute } from '@rocket.chat/ui-contexts';
import RegistrationPageRouter from '@rocket.chat/web-ui-registration';
import React, { ReactElement, useEffect } from 'react';

import RegistrationI18nProvider from '../root/providers/RegistrationI18nProvider';

const SecretURLPage = (): ReactElement | null => {
	const uid = useUserId();
	const homeRouter = useRoute('home');

	useEffect(() => {
		if (uid) {
			homeRouter.replace();
		}
	}, [uid, homeRouter]);

	if (uid) {
		return null;
	}

	return (
		<RegistrationI18nProvider>
			<RegistrationPageRouter defaultRoute='secret-register' />
		</RegistrationI18nProvider>
	);
};

export default SecretURLPage;
