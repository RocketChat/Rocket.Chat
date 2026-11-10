import type { IIntegrationHistory, Serialized } from '@rocket.chat/core-typings';
import { Skeleton, Box, Accordion, Stack } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import HistoryItem from './HistoryItem';

export type HistoryContentProps = { data: Serialized<IIntegrationHistory>[]; isLoading: boolean };

const HistoryContent = ({ data, isLoading }: HistoryContentProps) => {
	const { t } = useTranslation();

	if (isLoading) {
		return (
			<Box width='full' paddingBlock={24} display='flex' flexDirection='column' gap={8}>
				<Stack gap={4}>
					<Skeleton />
					<Skeleton />
				</Stack>
				<Stack gap={4}>
					<Skeleton />
					<Skeleton />
				</Stack>
				<Box display='flex' flexDirection='column' gap={4} paddingBlockEnd={8}>
					<Skeleton />
					<Skeleton />
				</Box>
			</Box>
		);
	}

	if (data.length < 1) {
		return <Box marginBlockStart={16}>{t('Integration_Outgoing_WebHook_No_History')}</Box>;
	}

	return (
		<Box width='full' maxWidth='x600' marginInline='auto'>
			<Accordion key='content'>
				{data.map((current) => (
					<HistoryItem data={current} key={current._id} />
				))}
			</Accordion>
		</Box>
	);
};

export default HistoryContent;
