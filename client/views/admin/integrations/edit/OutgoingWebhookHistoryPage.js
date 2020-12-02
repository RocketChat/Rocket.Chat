import { Button, ButtonGroup, Icon, Skeleton, Box, Accordion, Field, FieldGroup, Pagination } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState, useEffect } from 'react';

import Page from '../../../../components/Page';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useHighlightedCode } from '../../../../hooks/useHighlightedCode';
import { integrations as eventList } from '../../../../../app/integrations/lib/rocketchat';
import { useMethod } from '../../../../contexts/ServerContext';
import { useRoute, useRouteParameter } from '../../../../contexts/RouterContext';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { integrationHistoryStreamer } from '../../../../../app/integrations/client/streamer';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';

function HistoryItem({ data, ...props }) {
	const t = useTranslation();

	const replayOutgoingIntegration = useMethod('replayOutgoingIntegration');

	const {
		_id,
		_createdAt,
		_updatedAt,
		httpResult,
		event,
		step,
		httpCallData,
		data: dataSentToTrigger,
		prepareSentMessage,
		processSentMessage,
		url,
		httpError,
		errorStack,
		error,
		integration: { _id: integrationId },
	} = data;

	const createdAt = typeof _createdAt === 'string' ? _createdAt : _createdAt.toISOString();
	const updatedAt = typeof _updatedAt === 'string' ? _updatedAt : _updatedAt.toISOString();

	const handleClickReplay = useMutableCallback((e) => {
		e.stopPropagation();
		replayOutgoingIntegration({ integrationId, historyId: _id });
	});

	const formatDateAndTime = useFormatDateAndTime();

	const dataSentToTriggerCode = useHighlightedCode('json', JSON.stringify(dataSentToTrigger || '', null, 2));
	const prepareSentMessageCode = useHighlightedCode('json', JSON.stringify(prepareSentMessage || '', null, 2));
	const processSentMessageCode = useHighlightedCode('json', JSON.stringify(processSentMessage || '', null, 2));
	const httpCallDataCode = useHighlightedCode('json', JSON.stringify(httpCallData || '', null, 2));
	const httpErrorCode = useHighlightedCode('json', JSON.stringify(httpError || '', null, 2));
	const httpResultCode = useHighlightedCode('json', JSON.stringify(httpResult || '', null, 2));
	const errorStackCode = useHighlightedCode('json', JSON.stringify(errorStack || '', null, 2));

	return <Accordion.Item
		title={
			<Box display='inline-flex' w='full' flexDirection='row' justifyContent='space-between'>
				<Box display='flex' flexDirection='row' alignItems='center'>
					<Icon name='info-circled' size='x16' mie='x4'/>{formatDateAndTime(_createdAt)}
				</Box>
				<Button ghost onClick={handleClickReplay}>{t('Replay')}</Button>
			</Box>
		}
		{...props}
	>
		<FieldGroup>
			<Field>
				<Field.Label>{t('Status')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<code>{error ? t('Failure') : t('Success')}</code>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Time_Triggered')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<code>{createdAt}</code>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Time_Ended_Or_Error')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<code>{updatedAt}</code>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Event_Trigger')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<code>{t(eventList.outgoingEvents[event].label)}</code>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Trigger_Step')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<code>{step}</code>
					</Box>
				</Field.Row>
			</Field>
			{dataSentToTrigger && <Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Data_Passed_To_Trigger')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<pre><code dangerouslySetInnerHTML={{ __html: dataSentToTriggerCode }}></code></pre>
					</Box>
				</Field.Row>
			</Field>}
			{prepareSentMessage && <Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Messages_Sent_From_Prepare_Script')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<pre><code dangerouslySetInnerHTML={{ __html: prepareSentMessageCode }}></code></pre>
					</Box>
				</Field.Row>
			</Field>}
			{processSentMessage && <Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Messages_Sent_From_Process_Script')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<pre><code dangerouslySetInnerHTML={{ __html: processSentMessageCode }}></code></pre>
					</Box>
				</Field.Row>
			</Field>}
			{url && <Field>
				<Field.Label>{t('URL')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<code>{url}</code>
					</Box>
				</Field.Row>
			</Field>}
			{httpCallData && <Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Data_Passed_To_URL')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<pre><code dangerouslySetInnerHTML={{ __html: httpCallDataCode }}></code></pre>
					</Box>
				</Field.Row>
			</Field>}
			{httpError && <Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Http_Response_Error')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<pre><code dangerouslySetInnerHTML={{ __html: httpErrorCode }}></code></pre>
					</Box>
				</Field.Row>
			</Field>}
			{httpResult && <Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Http_Response')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<pre><code dangerouslySetInnerHTML={{ __html: httpResultCode }}></code></pre>
					</Box>
				</Field.Row>
			</Field>}
			{errorStack && <Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Error_Stacktrace')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<pre><code dangerouslySetInnerHTML={{ __html: errorStackCode }}></code></pre>
					</Box>
				</Field.Row>
			</Field>}
		</FieldGroup>
	</Accordion.Item>;
}

function HistoryContent({ data, state, onChange, ...props }) {
	const t = useTranslation();

	if (!data || state === AsyncStatePhase.LOADING) {
		return <Box w='full' pb='x24' {...props}>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (data.length < 1) {
		return <Box mbs='x16' {...props}>{t('Integration_Outgoing_WebHook_No_History')}</Box>;
	}

	return <>
		<Accordion w='full' maxWidth='x600' alignSelf='center' key='content'>
			{data.map((current) => <HistoryItem
				data={current}
				key={current._id}
			/>)}
		</Accordion>
	</>;
}

function OutgoingWebhookHistoryPage(props) {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const [currentData, setCurrentData] = useState();
	const [current, setCurrent] = useState();
	const [itemsPerPage, setItemsPerPage] = useState();

	const [mounted, setMounted] = useState(false);
	const [total, setTotal] = useState(0);

	const router = useRoute('admin-integrations');

	const clearHistory = useMethod('clearIntegrationHistory');

	const id = useRouteParameter('id');

	const query = useMemo(() => ({
		id,
		count: itemsPerPage,
		offset: current,
	}), [id, itemsPerPage, current]);

	const { value: data, phase: state, reload } = useEndpointData('integrations.history', query);

	const handleClearHistory = async () => {
		try {
			await clearHistory();
			dispatchToastMessage({ type: 'success', message: t('Integration_History_Cleared') });
			reload();
			setMounted(false);
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	const handleClickReturn = () => {
		router.push({ });
	};

	const handleDataChange = useMutableCallback(({ type, id, diff, data }) => {
		if (type === 'inserted') {
			setTotal((total) => total + 1);
			setCurrentData((state) => [data].concat(state));
			return;
		}

		if (type === 'updated') {
			setCurrentData((state) => {
				const index = state.findIndex(({ _id }) => _id === id);
				Object.assign(state[index], diff);
				return state;
			});
			return;
		}

		if (type === 'removed') {
			setCurrentData([]);
		}
	});

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED && !mounted) {
			setCurrentData(data.history);
			setTotal(data.total);
			setMounted(true);
		}
	}, [data, mounted, state]);

	useEffect(() => {
		if (mounted) {
			integrationHistoryStreamer.on(id, handleDataChange);
		}

		return () => integrationHistoryStreamer.removeListener(id, handleDataChange);
	}, [handleDataChange, id, mounted]);

	const showingResultsLabel = useCallback(({ count, current, itemsPerPage }) => t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count), [t]);

	return <Page flexDirection='column' {...props}>
		<Page.Header title={t('Integration_Outgoing_WebHook_History')}>
			<ButtonGroup>
				<Button onClick={handleClickReturn}>
					<Icon name='back' size='x16'/> {t('Back')}
				</Button>
				<Button primary danger onClick={handleClearHistory} disabled={total === 0}>
					<Icon name='trash'/> {t('clear_history')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<HistoryContent key='historyContent' data={currentData} state={state} />
			<Pagination
				current={current}
				itemsPerPage={itemsPerPage}
				itemsPerPageLabel={t('Items_per_page:')}
				showingResultsLabel={showingResultsLabel}
				count={total}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
			/>
		</Page.ScrollableContentWithShadow>
	</Page>;
}

export default OutgoingWebhookHistoryPage;
