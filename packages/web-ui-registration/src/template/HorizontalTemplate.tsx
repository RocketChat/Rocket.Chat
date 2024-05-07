import { Box } from '@rocket.chat/fuselage';
import {
	HorizontalWizardLayout,
	HorizontalWizardLayoutAside,
	HorizontalWizardLayoutContent,
	HorizontalWizardLayoutTitle,
	HorizontalWizardLayoutFooter,
} from '@rocket.chat/layout';
import { useSetting, useAssetWithDarkModePath } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';

import LoginPoweredBy from '../components/LoginPoweredBy';
import LoginSwitchLanguageFooter from '../components/LoginSwitchLanguageFooter';
import LoginTerms from '../components/LoginTerms';
import { RegisterTitle } from '../components/RegisterTitle';

const HorizontalTemplate = ({ children }: { children: ReactNode }): ReactElement => {
	const hideLogo = useSetting<boolean>('Layout_Login_Hide_Logo');
	const customLogo = useAssetWithDarkModePath('logo');
	const customBackground = useAssetWithDarkModePath('background');

	return (
		<HorizontalWizardLayout
			background={customBackground}
			logo={!hideLogo && customLogo ? <Box is='img' maxHeight='x40' mi='neg-x8' src={customLogo} alt='Logo' /> : <></>}
		>
			<HorizontalWizardLayoutAside>
				<HorizontalWizardLayoutTitle>
					<RegisterTitle />
				</HorizontalWizardLayoutTitle>
				<LoginPoweredBy />
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
