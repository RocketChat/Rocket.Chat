import { Box, Accordion } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, useEffect } from 'react';

import Page from '../../../components/Page';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import LogItem from './LogItem';
import LogsLoading from './LogsLoading';

const useAppWithLogs = ({ id }) => {
	const [data, setData] = useSafely(useState({}));
	const getAppData = useEndpoint('GET', `/apps/${id}`);
	const getAppLogs = useEndpoint('GET', `/apps/${id}/logs`);

	const fetchData = useCallback(async () => {
		try {
			const [{ app }, { logs }] = await Promise.all([getAppData(), getAppLogs()]);
			setData({ ...app, logs });
		} catch (error) {
			setData({ error });
		}
	}, [getAppData, getAppLogs, setData]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const total = data.logs ? data.logs.length : 0;
	const filteredData = data.logs ? { ...data, logs: data.logs } : data;

	return [filteredData, total, fetchData];
};

function AppLogsPage({ id, ...props }) {
	const formatDateAndTime = useFormatDateAndTime();

	const [app] = useAppWithLogs({ id });

	const loading = !Object.values(app).length;
	const showData = !loading && !app.error;

	return (
		<Page flexDirection='column' {...props}>
			<Page.ScrollableContent>
				{loading && <LogsLoading />}
				{app.error && (
					<Box maxWidth='x600' alignSelf='center' fontScale='hh21'>
						{app.error.message}
					</Box>
				)}
				{showData && (
					<>
						<Accordion width='100%' alignSelf='center'>
							{app.logs &&
								app.logs.map((log) => (
									<LogItem
										key={log._createdAt}
										title={`${formatDateAndTime(log._createdAt)}: "${log.method}" (${log.totalTime}ms)`}
										instanceId={log.instanceId}
										entries={log.entries}
									/>
								))}
						</Accordion>
					</>
				)}
			</Page.ScrollableContent>
		</Page>
	);
}

export default AppLogsPage;
