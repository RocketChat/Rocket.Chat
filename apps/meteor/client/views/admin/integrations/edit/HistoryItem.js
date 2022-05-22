import { Button, Icon, Box, Accordion, Field, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { outgoingEvents } from '../../../../../app/integrations/lib/outgoingEvents';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useHighlightedCode } from '../../../../hooks/useHighlightedCode';

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

	return (
		<Accordion.Item
			title={
				<Box display='inline-flex' w='full' flexDirection='row' justifyContent='space-between'>
					<Box display='flex' flexDirection='row' alignItems='center'>
						<Icon name='info-circled' size='x16' mie='x4' />
						{formatDateAndTime(_createdAt)}
					</Box>
					<Button ghost onClick={handleClickReplay}>
						{t('Replay')}
					</Button>
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
							<code>{t(outgoingEvents[event].label)}</code>
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
				{dataSentToTrigger && (
					<Field>
						<Field.Label>{t('Integration_Outgoing_WebHook_History_Data_Passed_To_Trigger')}</Field.Label>
						<Field.Row>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: dataSentToTriggerCode }}></code>
								</pre>
							</Box>
						</Field.Row>
					</Field>
				)}
				{prepareSentMessage && (
					<Field>
						<Field.Label>{t('Integration_Outgoing_WebHook_History_Messages_Sent_From_Prepare_Script')}</Field.Label>
						<Field.Row>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: prepareSentMessageCode }}></code>
								</pre>
							</Box>
						</Field.Row>
					</Field>
				)}
				{processSentMessage && (
					<Field>
						<Field.Label>{t('Integration_Outgoing_WebHook_History_Messages_Sent_From_Process_Script')}</Field.Label>
						<Field.Row>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: processSentMessageCode }}></code>
								</pre>
							</Box>
						</Field.Row>
					</Field>
				)}
				{url && (
					<Field>
						<Field.Label>{t('URL')}</Field.Label>
						<Field.Row>
							<Box withRichContent w='full'>
								<code>{url}</code>
							</Box>
						</Field.Row>
					</Field>
				)}
				{httpCallData && (
					<Field>
						<Field.Label>{t('Integration_Outgoing_WebHook_History_Data_Passed_To_URL')}</Field.Label>
						<Field.Row>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: httpCallDataCode }}></code>
								</pre>
							</Box>
						</Field.Row>
					</Field>
				)}
				{httpError && (
					<Field>
						<Field.Label>{t('Integration_Outgoing_WebHook_History_Http_Response_Error')}</Field.Label>
						<Field.Row>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: httpErrorCode }}></code>
								</pre>
							</Box>
						</Field.Row>
					</Field>
				)}
				{httpResult && (
					<Field>
						<Field.Label>{t('Integration_Outgoing_WebHook_History_Http_Response')}</Field.Label>
						<Field.Row>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: httpResultCode }}></code>
								</pre>
							</Box>
						</Field.Row>
					</Field>
				)}
				{errorStack && (
					<Field>
						<Field.Label>{t('Integration_Outgoing_WebHook_History_Error_Stacktrace')}</Field.Label>
						<Field.Row>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: errorStackCode }}></code>
								</pre>
							</Box>
						</Field.Row>
					</Field>
				)}
			</FieldGroup>
		</Accordion.Item>
	);
}

export default HistoryItem;
