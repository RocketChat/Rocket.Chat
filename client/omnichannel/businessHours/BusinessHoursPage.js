import React, { lazy, useMemo } from 'react';
// import { Box } from '@rocket.chat/fuselage';\

import Page from '../../components/basic/Page';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { businessHourManager } from '../../../app/livechat/client/views/app/business-hours/BusinessHours';

const useBHView = () => useReactiveValue(() => businessHourManager.getTemplate());

const BusinessHoursPage = () => {
	const t = useTranslation();
	const view = useBHView();

	const router = useRoute('omnichannel-businessHours');

	if (view === 'livechatBusinessHoursForm') {
		router.push({
			context: 'edit',
			type: 'default',
		});
	}

	const Table = useMemo(() => lazy(() => import('../../../ee/client/omnichannel/BusinessHoursTable')), []);

	return <Page>
		<Page.Header title={t('Business_Hours')}/>
		<Page.ScrollableContentWithShadow>
			<Table />
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default BusinessHoursPage;
