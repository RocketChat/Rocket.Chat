import { css } from '@rocket.chat/css-in-js';
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

const responsiveFooterStyles = css`
	@media (max-width: 768px) {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;

		& > * {
			width: 100%;
			text-align: center;
			justify-content: center;
		}
	}
`;

const HorizontalTemplate = ({ children }: { children: ReactNode }): ReactElement => {
	const hideLogo = useSetting('Layout_Login_Hide_Logo', false);
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
					<Box className={responsiveFooterStyles}>
						<LoginTerms />
						<LoginSwitchLanguageFooter />
					</Box>
				</HorizontalWizardLayoutFooter>
			</HorizontalWizardLayoutContent>
		</HorizontalWizardLayout>
	);
};

export default HorizontalTemplate;
