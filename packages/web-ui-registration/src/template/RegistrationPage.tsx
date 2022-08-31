import {
	HorizontalWizardLayout,
	HorizontalWizardLayoutAside,
	HorizontalWizardLayoutContent,
	HorizontalWizardLayoutTitle,
	HorizontalWizardLayoutFooter,
} from '@rocket.chat/layout';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import Footer from '../Footer';
import PoweredBy from '../LoginPoweredBy';
import LoginTerms from '../LoginTerms';
import { RegisterTitle } from '../components/RegisterTitle';

export const RegistrationPage = ({ children }: { children: ReactNode }): ReactElement => (
	<HorizontalWizardLayout>
		<HorizontalWizardLayoutAside>
			<HorizontalWizardLayoutTitle>
				<RegisterTitle />
			</HorizontalWizardLayoutTitle>
		</HorizontalWizardLayoutAside>
		<HorizontalWizardLayoutContent>
			{children}
			<HorizontalWizardLayoutFooter>
				<LoginTerms />
				<PoweredBy />
				<Footer />
			</HorizontalWizardLayoutFooter>
		</HorizontalWizardLayoutContent>
	</HorizontalWizardLayout>
);
