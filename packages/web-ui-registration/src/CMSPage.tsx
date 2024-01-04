import { Box, IconButton } from '@rocket.chat/fuselage';
import { VerticalWizardLayout, VerticalWizardLayoutFooter, VerticalWizardLayoutForm, VerticalWizardLayoutTitle } from '@rocket.chat/layout';
import { useSetting, useTranslation, useAssetWithDarkModePath } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { LoginPoweredBy } from './components/LoginPoweredBy';

type CMSPageProps = {
	page: 'Layout_Terms_of_Service' | 'Layout_Privacy_Policy' | 'Layout_Legal_Notice';
};

const CMSPage = ({ page }: CMSPageProps): ReactElement => {
	const t = useTranslation();
	const pageContent = useSetting(page) as string;

	const customLogo = useAssetWithDarkModePath('logo');
	const customBackground = useAssetWithDarkModePath('background');

	return (
		<VerticalWizardLayout
			background={customBackground}
			logo={customLogo ? <Box is='img' maxHeight='x40' mi='neg-x8' src={customLogo} alt='Logo' /> : undefined}
		>
			<VerticalWizardLayoutTitle>{t(page)}</VerticalWizardLayoutTitle>
			<VerticalWizardLayoutForm>
				<Box p={32}>
					<IconButton title={t('Back')} icon='arrow-back' onClick={() => window.history.back()} style={{ float: 'right' }} />
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
