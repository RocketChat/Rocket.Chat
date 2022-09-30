import { Accordion, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { AsyncStatePhase } from '../../../lib/asyncState';
import AccordionLoading from './AccordionLoading';
import LogItem from './LogItem';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const { value, phase: logsPhase, error } = useEndpointData(`/apps/${id}/logs`);

	const loading = logsPhase === AsyncStatePhase.LOADING;

	const isLogsFailing = logsPhase === AsyncStatePhase.REJECTED;

	return (
		<>
			{loading && <AccordionLoading />}
			{isLogsFailing && (
				<Box maxWidth='x600' alignSelf='center'>
					{error ? error.message : t('Unknown_error')}
				</Box>
			)}
			{!loading && logsPhase === AsyncStatePhase.RESOLVED && (
				<Accordion width='100%' alignSelf='center'>
					{value?.logs?.map((log) => (
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
