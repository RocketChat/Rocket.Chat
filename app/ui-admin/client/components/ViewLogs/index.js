import React from 'react';
import { Box } from '@rocket.chat/fuselage';

// eslint-disable-next-line import/no-unresolved
import { APIClient } from '../../../../app/utils/client/index';
import { useTranslation } from '../../../contexts/TranslationContext';
import { Page } from '../../basic/Page';

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
