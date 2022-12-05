import {
	HorizontalWizardLayout,
	HorizontalWizardLayoutAside,
	HorizontalWizardLayoutContent,
	HorizontalWizardLayoutTitle,
	HorizontalWizardLayoutFooter,
	HorizontalWizardLayoutDescription,
} from '@rocket.chat/layout';
import type { ReactElement, ReactNode } from 'react';
import { Box } from '@rocket.chat/fuselage';

import LoginSwitchLanguageFooter from '../components/LoginSwitchLanguageFooter';
import LoginPoweredBy from '../components/LoginPoweredBy';
import LoginTerms from '../components/LoginTerms';
import { RegisterTitle } from '../components/RegisterTitle';
import { useAssetPath } from '../hooks/useAssetPath';

const HorizontalTemplate = ({ children }: { children: ReactNode }): ReactElement => {
	const customLogo = useAssetPath('Assets_logo');
	const customBackground = useAssetPath('Assets_background');

	return (
		<HorizontalWizardLayout
			background={customBackground}
			logo={customLogo ? <Box is='img' maxHeight='x40' mi='neg-x8' src={customLogo} alt='Logo' /> : undefined}
		>
			<HorizontalWizardLayoutAside>
				<HorizontalWizardLayoutTitle>
					<RegisterTitle />
				</HorizontalWizardLayoutTitle>
				<HorizontalWizardLayoutDescription>
					<LoginPoweredBy />
				</HorizontalWizardLayoutDescription>
			</HorizontalWizardLayoutAside>
			<HorizontalWizardLayoutContent>
				{children}
				<HorizontalWizardLayoutFooter>
					<LoginTerms />
					<LoginSwitchLanguageFooter />
				</HorizontalWizardLayoutFooter>
			</HorizontalWizardLayoutContent>
		</HorizontalWizardLayout>
	);
};

export default HorizontalTemplate;
