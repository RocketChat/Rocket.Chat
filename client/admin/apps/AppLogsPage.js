import React, { useCallback, useState } from 'react';
import { Box, Button, ButtonGroup, Icon, Accordion, Skeleton, Margins, Pagination } from '@rocket.chat/fuselage';

import { useCurrentRoute, useRoute } from '../../contexts/RouterContext';
import { useAppWithLogs } from './hooks/useAppWithLogs';
import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useHighlightedCode } from '../../hooks/useHighlightedCode';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';

const LogEntry = ({ severity, timestamp, caller, args }) => {
	const t = useTranslation();
	return <Box>
		<Box>{severity}: {timestamp} {t('Caller')}: {caller}</Box>
		<Box withRichContent width='full'>
			<pre>
				<code
					dangerouslySetInnerHTML={{
						__html: useHighlightedCode('json', JSON.stringify(args, null, 2)),
					}}
				/>
			</pre>
		</Box>
	</Box>;
};

const LogItem = ({ entries, instanceId, title, t, ...props }) => <Accordion.Item title={title} {...props}>
	{instanceId && <Box>{t('Instance')}: {instanceId}</Box>}
	{entries.map(({ severity, timestamp, caller, args }, i) => <LogEntry
		key={i}
		severity={severity}
		timestamp={timestamp}
		caller={caller}
		args={args}
	/>)}
</Accordion.Item>;

const LogsLoading = () => <Box maxWidth='x600' w='full' alignSelf='center'>
	<Margins block='x2'>
		<Skeleton variant='rect' width='100%' height='x80' />
		<Skeleton variant='rect' width='100%' height='x80' />
		<Skeleton variant='rect' width='100%' height='x80' />
	</Margins>
</Box>;

export default function AppLogsPage({ id, ...props }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const [itemsPerPage, setItemsPerPage] = useState(25);
	const [current, setCurrent] = useState(0);
	const [cache, setCache] = useState(0);

	const [data, total] = useAppWithLogs({ id, cache, itemsPerPage, current });

	const currentRoute = useCurrentRoute();
	const router = useRoute(currentRoute[0]);

	const handleResetButtonClick = () => {
		setCache(new Date());
	};

	const handleBackButtonClick = () => {
		router.push({});
	};

	const {
		name,
	} = data;

	const loading = !Object.values(data).length;
	const showData = !loading && !data.error;

	const showingResultsLabel = useCallback(({ count, current, itemsPerPage }) => t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count), [t]);
	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), [t]);

	return <Page flexDirection='column' {...props}>
		<Page.Header title={t('View_the_Logs_for', { name: name || '' })}>
			<ButtonGroup>
				<Button primary onClick={handleResetButtonClick}>
					<Icon name='undo'/> {t('Refresh')}
				</Button>
				<Button onClick={handleBackButtonClick}>
					<Icon name='back'/> {t('Back')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContent>
			{loading && <LogsLoading />}
			{data.error && <Box maxWidth='x600' alignSelf='center' fontScale='h1'>{data.error.message}</Box>}
			{showData && <>
				<Accordion maxWidth='x600' alignSelf='center'>
					{data.logs && data.logs.map((log) => <LogItem
						key={log._createdAt}
						title={`${ formatDateAndTime(log._createdAt) }: "${ log.method }" (${ log.totalTime }ms)`}
						instanceId={log.instanceId}
						entries={log.entries}
						t={t}
					/>)}
				</Accordion>
			</>}
		</Page.ScrollableContent>

		<Pagination
			mi='x24'
			divider
			current={current}
			itemsPerPage={itemsPerPage}
			itemsPerPageLabel={itemsPerPageLabel}
			showingResultsLabel={showingResultsLabel}
			count={total}
			onSetItemsPerPage={setItemsPerPage}
			onSetCurrent={setCurrent}
		/>
	</Page>;
}
