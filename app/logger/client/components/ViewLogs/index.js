import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import { APIClient } from '../../../../utils/client/index';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { Page } from '../../../../../client/components/basic/Page';

export function ViewLogs() {
	// const { queue } = await APIClient.v1.get('stdout.queue');
	const test = APIClient.v1.get('stdout.queue');
	const t = useTranslation();
	return <Page _id='viewlogs' i18nLabel='ViewLogs'>
		<Page.Header title={t('View Logs')}></Page.Header>
		<Box componentClassName='mongo-logs' width='full' height='full'>
			{ console.log(test) }
		</Box>
	</Page>;
}
