import { Box } from '@rocket.chat/fuselage';
import { VerticalWizardLayout, VerticalWizardLayoutTitle, VerticalWizardLayoutFooter } from '@rocket.chat/layout';
import { useSetting, useAssetWithDarkModePath } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';

import LoginPoweredBy from '../components/LoginPoweredBy';
import LoginSwitchLanguageFooter from '../components/LoginSwitchLanguageFooter';
import LoginTerms from '../components/LoginTerms';
import { RegisterTitle } from '../components/RegisterTitle';

const VerticalTemplate = ({ children }: { children: ReactNode }): ReactElement => {
	const hideLogo = useSetting<boolean>('Layout_Login_Hide_Logo');
	const customLogo = useAssetWithDarkModePath('logo');
	const customBackground = useAssetWithDarkModePath('background');

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
