import { Accordion, Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItem from './AppLogsItem';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import AccordionLoading from '../../../components/AccordionLoading';
import { useLogs } from '../../../hooks/useLogs';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const { data, isSuccess, isError, isLoading } = useLogs(id);

	return (
		<>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center'>
					{t('App_not_found')}
				</Box>
			)}
			{isSuccess && (
				<Accordion width='100%' alignSelf='center'>
					{data?.logs?.map((log) => (
						<AppLogsItem
							key={log._createdAt}
							title={`${formatDateAndTime(log._createdAt)}: "${log.method}" (${log.totalTime}ms)`}
							instanceId={log.instanceId}
							entries={log.entries}
						/>
					))}
				</Accordion>
			)}
		</>
	);
};

export default AppLogs;
