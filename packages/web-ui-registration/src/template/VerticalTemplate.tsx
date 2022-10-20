import { VerticalWizardLayout, VerticalWizardLayoutTitle, VerticalWizardLayoutFooter } from '@rocket.chat/layout';
import type { ReactElement, ReactNode } from 'react';
import { Box } from '@rocket.chat/fuselage';

import LoginSwitchLanguageFooter from '../components/LoginSwitchLanguageFooter';
import LoginPoweredBy from '../components/LoginPoweredBy';
import LoginTerms from '../components/LoginTerms';
import { RegisterTitle } from '../components/RegisterTitle';
import { useAssetPath } from '../hooks/useAssetPath';

const VerticalTemplate = ({ children }: { children: ReactNode }): ReactElement => {
	const customLogo = useAssetPath('Assets_logo');
	const customBackground = useAssetPath('Assets_background');

	return (
		<VerticalWizardLayout
			background={customBackground}
			logo={customLogo ? <Box is='img' maxHeight='x40' mi='neg-x8' src={customLogo} alt='Logo' /> : undefined}
		>
			<VerticalWizardLayoutTitle>
				<RegisterTitle />
				<LoginPoweredBy />
			</VerticalWizardLayoutTitle>
			<Box is='h2' fontScale='h2'>
				{children}
			</Box>
			<VerticalWizardLayoutFooter>
				<LoginTerms />
				<LoginSwitchLanguageFooter />
			</VerticalWizardLayoutFooter>
		</VerticalWizardLayout>
	);
};

export default VerticalTemplate;
