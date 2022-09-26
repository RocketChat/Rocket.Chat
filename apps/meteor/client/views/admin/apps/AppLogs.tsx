import { AppOverview } from '@rocket.chat/core-typings';
import { Accordion, Box } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, useEffect, ReactElement } from 'react';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import AccordionLoading from './AccordionLoading';
import LogItem from './LogItem';

type logEntries = {
	args: string[];
	caller: string;
	severity: string;
	timestamp: string;
}[];

type logs = {
	appId: string;
	endTime: string;
	entries: logEntries;
	instanceId: string;
	method: string;
	startTime: string;
	totalTime: number;
	_createdAt: string;
	_id: string;
	_updatedAt: string;
}[];

type data = AppOverview & { logs: logs; logsError: string };

const useAppWithLogs = ({ id }: { id: string }): data => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const [data, setData] = useSafely(useState<data>({} as data));
	const [logsError, setLogsError] = useState('');
	const getAppData = useEndpoint('GET', `/apps/${id}`) as any;
	const getAppLogs = useEndpoint('GET', `/apps/${id}/logs`) as any;

	const fetchData = useCallback(async () => {
		try {
			const [{ app }, { logs }] = await Promise.all([getAppData(), getAppLogs()]);
			setData({ ...app, logs });
		} catch (error) {
			let message = t('Unknown_error');

			if (error instanceof Error) message = error.message;

			dispatchToastMessage({ type: 'error', message });
			setLogsError(message);
		}
	}, [dispatchToastMessage, getAppData, getAppLogs, setData, t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return { ...data, logsError };
};

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const formatDateAndTime = useFormatDateAndTime();

	const app = useAppWithLogs({ id });

	const loading = !Object.values(app).length;

	return (
		<>
			{loading && <AccordionLoading />}
			{Boolean(app.logsError) && (
				<Box maxWidth='x600' alignSelf='center'>
					{app.logsError}
				</Box>
			)}
			{!loading && (
				<Accordion width='100%' alignSelf='center'>
					{app.logs?.map((log) => (
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
