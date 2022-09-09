import { useUserId, useRoute } from '@rocket.chat/ui-contexts';
import RegistrationPageRouter from '@rocket.chat/web-ui-registration';
import React, { ReactElement, useEffect } from 'react';

import RegistrationI18nProvider from '../root/providers/RegistrationI18nProvider';

const SecretURLPage = (): ReactElement => {
	const uid = useUserId();
	const router = useRoute('home');

	useEffect(() => {
		if (uid) {
			router.replace();
		}
	}, [uid, router]);

	if (uid) {
		return <></>;
	}

	return (
		<RegistrationI18nProvider>
			<RegistrationPageRouter defaultRoute='secret-register' />
		</RegistrationI18nProvider>
	);
};

export default SecretURLPage;
