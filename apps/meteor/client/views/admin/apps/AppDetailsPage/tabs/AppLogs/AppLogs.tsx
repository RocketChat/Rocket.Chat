import { Accordion, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useFormatDateAndTime } from '../../../../../../hooks/useFormatDateAndTime';
import AccordionLoading from '../../../AccordionLoading';
import { useLogs } from '../../../hooks/useLogs';
import AppLogsItem from './AppLogsItem';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const t = useTranslation();
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
