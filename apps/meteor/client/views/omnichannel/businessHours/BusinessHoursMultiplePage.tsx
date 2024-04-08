import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { lazy, useMemo } from 'react';

import { Page, PageHeader, PageContent } from '../../../components/Page';

const BusinessHoursMultiplePage = () => {
	const t = useTranslation();
	const router = useRouter();

	const BusinessHoursTable = useMemo(() => lazy(() => import('../../../../ee/client/omnichannel/businessHours/BusinessHoursTable')), []);

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
