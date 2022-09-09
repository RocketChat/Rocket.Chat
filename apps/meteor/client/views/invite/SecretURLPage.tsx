import RegistrationPageRouter from '@rocket.chat/web-ui-registration';
import React, { ReactElement } from 'react';

import RegistrationI18nProvider from '../root/providers/RegistrationI18nProvider';

const SecretURLPage = (): ReactElement => (
	<RegistrationI18nProvider>
		<RegistrationPageRouter defaultRoute='secret-register' />
	</RegistrationI18nProvider>
);

export default SecretURLPage;
