import { Box } from '@rocket.chat/fuselage';
import {
	HorizontalWizardLayout,
	HorizontalWizardLayoutAside,
	HorizontalWizardLayoutContent,
	HorizontalWizardLayoutTitle,
	HorizontalWizardLayoutFooter,
} from '@rocket.chat/layout';
import { useSetting, useAssetWithDarkModePath } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import LoginPoweredBy from '../components/LoginPoweredBy.js';
import LoginSwitchLanguageFooter from '../components/LoginSwitchLanguageFooter.js';
import LoginTerms from '../components/LoginTerms.js';
import { RegisterTitle } from '../components/RegisterTitle.js';

export type HorizontalTemplateProps = { children: ReactNode };

const HorizontalTemplate = ({ children }: HorizontalTemplateProps) => {
	const hideLogo = useSetting('Layout_Login_Hide_Logo', false);
	const customLogo = useAssetWithDarkModePath('logo');
	const customBackground = useAssetWithDarkModePath('background');

	return (
		<HorizontalWizardLayout
			background={customBackground}
			logo={!hideLogo && customLogo ? <Box is='img' maxHeight='x40' marginInline='neg-x8' src={customLogo} alt='Logo' /> : <></>}
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
