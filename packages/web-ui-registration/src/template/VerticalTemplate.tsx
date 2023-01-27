import { VerticalWizardLayout, VerticalWizardLayoutTitle, VerticalWizardLayoutFooter } from '@rocket.chat/layout';
import type { ReactElement, ReactNode } from 'react';
import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';

import LoginSwitchLanguageFooter from '../components/LoginSwitchLanguageFooter';
import LoginPoweredBy from '../components/LoginPoweredBy';
import LoginTerms from '../components/LoginTerms';
import { RegisterTitle } from '../components/RegisterTitle';
import { useAssetPath } from '../hooks/useAssetPath';

const VerticalTemplate = ({ children }: { children: ReactNode }): ReactElement => {
	const hideLogo = useSetting<boolean>('Layout_Login_Hide_Logo');
	const customLogo = useAssetPath('Assets_logo');
	const customBackground = useAssetPath('Assets_background');

	return (
		<VerticalWizardLayout
			background={customBackground}
			logo={!hideLogo && customLogo ? <Box is='img' maxHeight='x40' mi='neg-x8' src={customLogo} alt='Logo' /> : <></>}
		>
			<VerticalWizardLayoutTitle>
				<RegisterTitle />
			</VerticalWizardLayoutTitle>
			<LoginPoweredBy />
			{children}
			<VerticalWizardLayoutFooter>
				<LoginTerms />
				<LoginSwitchLanguageFooter />
			</VerticalWizardLayoutFooter>
		</VerticalWizardLayout>
	);
};

export default VerticalTemplate;
