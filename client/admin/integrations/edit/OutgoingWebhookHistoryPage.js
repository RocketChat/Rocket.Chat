import { Button, ButtonGroup, Icon, Skeleton, Box, Accordion, Field, FieldGroup, Pagination } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback, useState } from 'react';

import Page from '../../../components/basic/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useHighlightedCode } from '../../../hooks/useHighlightedCode';
import { integrations as eventList } from '../../../../app/integrations/lib/rocketchat';
import { useMethod } from '../../../contexts/ServerContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';

function HistoryItem({ data, onChange, ...props }) {
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

	const handleClickReplay = useCallback((e) => {
		e.stopPropagation();
		replayOutgoingIntegration({ integrationId, historyId: _id });
		onChange();
	}, [_id, integrationId, onChange, replayOutgoingIntegration]);

	const formatDateAndTime = useFormatDateAndTime();

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
						<code>{_createdAt}</code>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Time_Ended_Or_Error')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<code>{_updatedAt}</code>
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
			<Field>
				<Field.Label>{t('Integration_Outgoing_WebHook_History_Data_Passed_To_Trigger')}</Field.Label>
				<Field.Row>
					<Box withRichContent w='full'>
						<pre><code dangerouslySetInnerHTML={{ __html: useHighlightedCode('json', JSON.stringify(dataSentToTrigger, null, 2)) }}></code></pre>
					</Box>
				</Field.Row>
			</Field>
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

	if (!data || state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24' {...props}>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (data.history.length < 1) {
		return <Box mbs='x16' {...props}>{t('Integration_Outgoing_WebHook_No_History')}</Box>;
	}

	return <>
		<Accordion w='full' maxWidth='x600' alignSelf='center' key='content'>
			{data.history.map((current) => <HistoryItem
				data={current}
				key={current._id}
				onChange={onChange}
			/>)}
		</Accordion>
	</>;
}

function OutgoingWebhookHistoryPage(props) {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const [cache, setCache] = useState();
	const [current, setCurrent] = useState();
	const [itemsPerPage, setItemsPerPage] = useState();
	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const router = useRoute('admin-integrations');

	const clearHistory = useMethod('clearIntegrationHistory');

	const handleClearHistory = async () => {
		try {
			await clearHistory();
			dispatchToastMessage({ type: 'success', message: t('Integration_History_Cleared') });
			onChange();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	const handleClickReturn = () => {
		router.push({ });
	};

	const id = useRouteParameter('id');

	const query = useMemo(() => ({
		id,
		count: itemsPerPage,
		offset: current,
		// TODO: remove cache. Is necessary for data validation
	}), [id, itemsPerPage, current, cache]);

	const { data, state } = useEndpointDataExperimental('integrations.history', query);

	const showingResultsLabel = useCallback(({ count, current, itemsPerPage }) => t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count), [t]);

	return <Page flexDirection='column' {...props}>
		<Page.Header title={t('Integration_Outgoing_WebHook_History')}>
			<ButtonGroup>
				<Button onClick={handleClickReturn}>
					<Icon name='back' size='x16'/> {t('Back')}
				</Button>
				<Button primary danger onClick={handleClearHistory} disabled={!(data && data.history.length > 0)}>
					<Icon name='trash'/> {t('clear_history')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<HistoryContent key='historyContent' data={data} state={state} onChange={onChange} />
			<Pagination
				current={current}
				itemsPerPage={itemsPerPage}
				itemsPerPageLabel={t('Items_per_page:')}
				showingResultsLabel={showingResultsLabel}
				count={(data && data.total) || 0}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
			/>
		</Page.ScrollableContentWithShadow>
	</Page>;
}

export default OutgoingWebhookHistoryPage;
