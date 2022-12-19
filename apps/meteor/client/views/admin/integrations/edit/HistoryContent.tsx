import type { IIntegrationHistory, Serialized } from '@rocket.chat/core-typings';
import { Skeleton, Box, Accordion } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import HistoryItem from './HistoryItem';

function HistoryContent({ data, isLoading }: { data: Serialized<IIntegrationHistory>[]; isLoading: boolean }): ReactElement {
	const t = useTranslation();

	if (isLoading) {
		return (
			<Box w='full' pb='x24'>
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
			</Box>
		);
	}

	if (data.length < 1) {
		return <Box mbs='x16'>{t('Integration_Outgoing_WebHook_No_History')}</Box>;
	}

	return (
		<Box display='flex' alignItems='center' flexDirection='column'>
			<Accordion w='full' maxWidth='x600' alignSelf='center' key='content'>
				{data.map((current) => (
					<HistoryItem data={current} key={current._id} />
				))}
			</Accordion>
		</Box>
	);
}

export default HistoryContent;
