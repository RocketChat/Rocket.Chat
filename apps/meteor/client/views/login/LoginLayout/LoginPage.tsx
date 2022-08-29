import {
	HorizontalWizardLayout,
	HorizontalWizardLayoutAside,
	HorizontalWizardLayoutContent,
	HorizontalWizardLayoutTitle,
} from '@rocket.chat/layout';
import React, { ReactElement } from 'react';

import Footer from './Footer';
import { LoginForm } from './LoginForm';
import PoweredBy from './LoginPoweredBy';
import LoginTerms from './LoginTerms';

export const LoginPage = (): ReactElement => (
	<HorizontalWizardLayout>
		<HorizontalWizardLayoutAside>
			<HorizontalWizardLayoutTitle>Welcome To Rocket.Chat</HorizontalWizardLayoutTitle>
		</HorizontalWizardLayoutAside>
		<HorizontalWizardLayoutContent>
			<LoginForm />
			<LoginTerms />
			<PoweredBy />
			<Footer />
		</HorizontalWizardLayoutContent>
	</HorizontalWizardLayout>
);

export default LoginPage;
