import { Box, IconButton } from '@rocket.chat/fuselage';
import { VerticalWizardLayout, VerticalWizardLayoutFooter, VerticalWizardLayoutForm, VerticalWizardLayoutTitle } from '@rocket.chat/layout';
import { useRoute, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import PoweredBy from '../login/LoginLayout/LoginPoweredBy';

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

	return (
		<VerticalWizardLayout>
			<VerticalWizardLayoutTitle>{t(page)}</VerticalWizardLayoutTitle>
			<VerticalWizardLayoutForm>
				<Box p='x32'>
					<IconButton icon='cancel' onClick={handlePageCloseClick} style={{ float: 'right' }} />
					<Box withRichContent dangerouslySetInnerHTML={{ __html: pageContent }} />
				</Box>
			</VerticalWizardLayoutForm>
			<VerticalWizardLayoutFooter>
				<PoweredBy />
			</VerticalWizardLayoutFooter>
		</VerticalWizardLayout>
	);
};

export default CMSPage;
