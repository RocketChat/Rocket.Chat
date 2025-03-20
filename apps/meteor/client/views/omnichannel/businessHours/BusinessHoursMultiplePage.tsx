import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader, PageContent } from '../../../components/Page';

const BusinessHoursTable = lazy(() => import('../../../omnichannel/businessHours/BusinessHoursTable'));

const BusinessHoursMultiplePage = () => {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<Page>
			<PageHeader title={t('Business_Hours')}>
				<ButtonGroup>
					<Button icon='plus' onClick={() => router.navigate('/omnichannel/businessHours/new')}>
						{t('New')}
					</Button>
				</ButtonGroup>
			</PageHeader>
			<PageContent>
				<BusinessHoursTable />
			</PageContent>
		</Page>
	);
};

export default BusinessHoursMultiplePage;
