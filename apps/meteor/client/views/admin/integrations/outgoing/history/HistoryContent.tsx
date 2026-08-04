import type { IIntegrationHistory, Serialized } from '@rocket.chat/core-typings';
import { Skeleton, Box, Accordion } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import HistoryItem from './HistoryItem';

export type HistoryContentProps = { data: Serialized<IIntegrationHistory>[]; isLoading: boolean };

const HistoryContent = ({ data, isLoading }: HistoryContentProps) => {
	const { t } = useTranslation();

	if (isLoading) {
		return (
			<Box width='full' paddingBlock={24}>
				<Skeleton marginBlockEnd={4} />
				<Skeleton marginBlockEnd={8} />
				<Skeleton marginBlockEnd={4} />
				<Skeleton marginBlockEnd={8} />
				<Skeleton marginBlockEnd={4} />
				<Skeleton marginBlockEnd={8} />
			</Box>
		);
	}

	if (data.length < 1) {
		return <Box marginBlockStart={16}>{t('Integration_Outgoing_WebHook_No_History')}</Box>;
	}

	return (
		<Box display='flex' alignItems='center' flexDirection='column'>
			<Accordion width='full' maxWidth='x600' alignSelf='center' key='content'>
				{data.map((current) => (
					<HistoryItem data={current} key={current._id} />
				))}
			</Accordion>
		</Box>
	);
};

export default HistoryContent;
