import React, { lazy, useMemo } from 'react';
import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/basic/Page';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';

const BusinessHoursPage = () => {
	const t = useTranslation();

	const router = useRoute('omnichannel-businessHours');

	const Table = useMemo(() => lazy(() => import('../../../ee/client/omnichannel/BusinessHoursTable')), []);

	const handleNew = useMutableCallback(() => {
		router.push({
			context: 'new',
		});
	});

	return <Page>
		<Page.Header title={t('Business_Hours')}>
			<ButtonGroup>
				<Button small square onClick={handleNew}>
					<Icon name='plus'/>
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Table />
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default BusinessHoursPage;
