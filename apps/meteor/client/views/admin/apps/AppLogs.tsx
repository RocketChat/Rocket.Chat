import { Accordion, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import AccordionLoading from './AccordionLoading';
import LogItem from './LogItem';
import { useLogs } from './hooks/useLogs';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const { data, isSuccess, isError, isLoading } = useLogs(id);

	return (
		<>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center'>
					{t('Unknown_error')}
				</Box>
			)}
			{isSuccess && (
				<Accordion width='100%' alignSelf='center'>
					{data?.logs?.map((log) => (
						<LogItem
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
