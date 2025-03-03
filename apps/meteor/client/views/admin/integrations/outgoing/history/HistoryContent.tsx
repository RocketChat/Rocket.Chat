import type { IIntegrationHistory, Serialized } from '@rocket.chat/core-typings';
import { Skeleton, Box, Accordion } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import HistoryItem from './HistoryItem';

const HistoryContent = ({ data, isLoading }: { data: Serialized<IIntegrationHistory>[]; isLoading: boolean }) => {
	const { t } = useTranslation();

	if (isLoading) {
		return (
			<Box w='full' pb={24}>
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
			</Box>
		);
	}

	if (data.length < 1) {
		return <Box mbs={16}>{t('Integration_Outgoing_WebHook_No_History')}</Box>;
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
};

export default HistoryContent;
