import { Skeleton, Box, Accordion } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import HistoryItem from './HistoryItem';

function HistoryContent({ data, state, onChange, ...props }) {
	const t = useTranslation();

	if (!data || state === AsyncStatePhase.LOADING) {
		return (
			<Box w='full' pb='x24' {...props}>
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
		return (
			<Box mbs='x16' {...props}>
				{t('Integration_Outgoing_WebHook_No_History')}
			</Box>
		);
	}

	return (
		<>
			<Accordion w='full' maxWidth='x600' alignSelf='center' key='content'>
				{data.map((current) => (
					<HistoryItem data={current} key={current._id} />
				))}
			</Accordion>
		</>
	);
}

export default HistoryContent;
