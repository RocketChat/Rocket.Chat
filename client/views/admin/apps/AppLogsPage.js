import { Box, Button, ButtonGroup, Icon, Accordion, Pagination } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useEffect } from 'react';

import Page from '../../../components/Page';
import { useCurrentRoute, useRoute } from '../../../contexts/RouterContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import LogItem from './LogItem';
import LogsLoading from './LogsLoading';

const useAppWithLogs = ({ id, current, itemsPerPage }) => {
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

	const sliceStart = data.logs && current > data.logs.length ? 0 : current;
	const total = data.logs ? data.logs.length : 0;
	const filteredData = data.logs ? { ...data, logs: data.logs.slice(sliceStart, itemsPerPage + current) } : data;

	return [filteredData, total, fetchData];
};

function AppLogsPage({ id, ...props }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const [itemsPerPage, setItemsPerPage] = useState(25);
	const [current, setCurrent] = useState(0);

	const [app, logEntriesCount, fetchData] = useAppWithLogs({ id, itemsPerPage, current });

	const [currentRouteName] = useCurrentRoute();
	const appLogsRoute = useRoute(currentRouteName);

	const handleResetButtonClick = () => {
		fetchData();
	};

	const handleBackButtonClick = () => {
		appLogsRoute.push();
	};

	const loading = !Object.values(app).length;
	const showData = !loading && !app.error;

	const showingResultsLabel = useCallback(
		({ count, current, itemsPerPage }) => t('Showing_results_of', current + 1, Math.min(current + itemsPerPage, count), count),
		[t],
	);
	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), [t]);

	return (
		<Page flexDirection='column' {...props}>
			<Page.Header title={t('View_the_Logs_for', { name: app.name || '' })}>
				<ButtonGroup>
					<Button primary onClick={handleResetButtonClick}>
						<Icon name='undo' /> {t('Refresh')}
					</Button>
					<Button onClick={handleBackButtonClick}>
						<Icon name='back' /> {t('Back')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent>
				{loading && <LogsLoading />}
				{app.error && (
					<Box maxWidth='x600' alignSelf='center' fontScale='hh21'>
						{app.error.message}
					</Box>
				)}
				{showData && (
					<>
						<Accordion maxWidth='x600' alignSelf='center'>
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

			<Pagination
				mi='x24'
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				itemsPerPageLabel={itemsPerPageLabel}
				showingResultsLabel={showingResultsLabel}
				count={logEntriesCount}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
			/>
		</Page>
	);
}

export default AppLogsPage;
