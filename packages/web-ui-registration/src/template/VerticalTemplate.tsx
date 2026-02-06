import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { VerticalWizardLayout, VerticalWizardLayoutTitle, VerticalWizardLayoutFooter } from '@rocket.chat/layout';
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

const VerticalTemplate = ({ children }: { children: ReactNode }): ReactElement => {
	const hideLogo = useSetting('Layout_Login_Hide_Logo', false);
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
				<Box className={responsiveFooterStyles}>
					<LoginTerms />
					<LoginSwitchLanguageFooter />
				</Box>
			</VerticalWizardLayoutFooter>
		</VerticalWizardLayout>
	);
};

export default VerticalTemplate;
