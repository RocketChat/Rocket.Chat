import { Box, IconButton } from '@rocket.chat/fuselage';
import { VerticalWizardLayout, VerticalWizardLayoutFooter, VerticalWizardLayoutForm, VerticalWizardLayoutTitle } from '@rocket.chat/layout';
import { useRoute, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { LoginPoweredBy } from './components/LoginPoweredBy';
import { useAssetPath } from './hooks/useAssetPath';

type CMSPageProps = {
	page: 'Layout_Terms_of_Service' | 'Layout_Privacy_Policy' | 'Layout_Legal_Notice';
};

const CMSPage = ({ page }: CMSPageProps): ReactElement => {
	const t = useTranslation();
	const homeRoute = useRoute('/');
	const pageContent = useSetting(page) as string;

	const handlePageCloseClick = (): void => {
		homeRoute.push();
	};

	const customLogo = useAssetPath('Assets_logo');
	const customBackground = useAssetPath('Assets_background');

	return (
		<VerticalWizardLayout
			background={customBackground}
			logo={customLogo ? <Box is='img' maxHeight='x40' mi='neg-x8' src={customLogo} alt='Logo' /> : undefined}
		>
			<VerticalWizardLayoutTitle>{t(page)}</VerticalWizardLayoutTitle>
			<VerticalWizardLayoutForm>
				<Box p='x32'>
					<IconButton icon='cancel' onClick={handlePageCloseClick} style={{ float: 'right' }} />
					<Box withRichContent dangerouslySetInnerHTML={{ __html: pageContent }} />
				</Box>
			</VerticalWizardLayoutForm>
			<VerticalWizardLayoutFooter>
				<LoginPoweredBy />
			</VerticalWizardLayoutFooter>
		</VerticalWizardLayout>
	);
};

export default CMSPage;
