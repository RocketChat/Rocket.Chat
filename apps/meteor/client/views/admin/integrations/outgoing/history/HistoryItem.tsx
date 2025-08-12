import type { IIntegrationHistory, Serialized } from '@rocket.chat/core-typings';
import { Button, Icon, Box, AccordionItem, Field, FieldGroup, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useMethod } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { outgoingEvents } from '../../../../../../app/integrations/lib/outgoingEvents';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useHighlightedCode } from '../../../../../hooks/useHighlightedCode';

const HistoryItem = ({ data }: { data: Serialized<IIntegrationHistory> }) => {
	const { t } = useTranslation();

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

	const createdAt = typeof _createdAt === 'string' ? _createdAt : (_createdAt as Date).toISOString();
	const updatedAt = typeof _updatedAt === 'string' ? _updatedAt : (_updatedAt as Date).toISOString();

	const handleClickReplay = useEffectEvent((e: MouseEvent) => {
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
		<AccordionItem
			title={
				<Box display='inline-flex' w='full' flexDirection='row' justifyContent='space-between'>
					<Box display='flex' flexDirection='row' alignItems='center'>
						<Icon name='info-circled' size='x16' mie={4} />
						{formatDateAndTime(_createdAt)}
					</Box>
					<Button secondary onClick={handleClickReplay}>
						{t('Replay')}
					</Button>
				</Box>
			}
		>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Status')}</FieldLabel>
					<FieldRow>
						<Box withRichContent w='full'>
							<code>{error ? t('Failure') : t('Success')}</code>
						</Box>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Integration_Outgoing_WebHook_History_Time_Triggered')}</FieldLabel>
					<FieldRow>
						<Box withRichContent w='full'>
							<code>{createdAt}</code>
						</Box>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Integration_Outgoing_WebHook_History_Time_Ended_Or_Error')}</FieldLabel>
					<FieldRow>
						<Box withRichContent w='full'>
							<code>{updatedAt}</code>
						</Box>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Event_Trigger')}</FieldLabel>
					<FieldRow>
						<Box withRichContent w='full'>
							<code>{t(outgoingEvents[event].label)}</code>
						</Box>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Integration_Outgoing_WebHook_History_Trigger_Step')}</FieldLabel>
					<FieldRow>
						<Box withRichContent w='full'>
							<code>{step}</code>
						</Box>
					</FieldRow>
				</Field>
				{dataSentToTrigger && (
					<Field>
						<FieldLabel>{t('Integration_Outgoing_WebHook_History_Data_Passed_To_Trigger')}</FieldLabel>
						<FieldRow>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(dataSentToTriggerCode) }}></code>
								</pre>
							</Box>
						</FieldRow>
					</Field>
				)}
				{prepareSentMessage && (
					<Field>
						<FieldLabel>{t('Integration_Outgoing_WebHook_History_Messages_Sent_From_Prepare_Script')}</FieldLabel>
						<FieldRow>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prepareSentMessageCode) }}></code>
								</pre>
							</Box>
						</FieldRow>
					</Field>
				)}
				{processSentMessage && (
					<Field>
						<FieldLabel>{t('Integration_Outgoing_WebHook_History_Messages_Sent_From_Process_Script')}</FieldLabel>
						<FieldRow>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processSentMessageCode) }}></code>
								</pre>
							</Box>
						</FieldRow>
					</Field>
				)}
				{url && (
					<Field>
						<FieldLabel>{t('URL')}</FieldLabel>
						<FieldRow>
							<Box withRichContent w='full'>
								<code>{url}</code>
							</Box>
						</FieldRow>
					</Field>
				)}
				{httpCallData && (
					<Field>
						<FieldLabel>{t('Integration_Outgoing_WebHook_History_Data_Passed_To_URL')}</FieldLabel>
						<FieldRow>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(httpCallDataCode) }}></code>
								</pre>
							</Box>
						</FieldRow>
					</Field>
				)}
				{httpError && (
					<Field>
						<FieldLabel>{t('Integration_Outgoing_WebHook_History_Http_Response_Error')}</FieldLabel>
						<FieldRow>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(httpErrorCode) }}></code>
								</pre>
							</Box>
						</FieldRow>
					</Field>
				)}
				{httpResult && (
					<Field>
						<FieldLabel>{t('Integration_Outgoing_WebHook_History_Http_Response')}</FieldLabel>
						<FieldRow>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(httpResultCode) }}></code>
								</pre>
							</Box>
						</FieldRow>
					</Field>
				)}
				{errorStack && (
					<Field>
						<FieldLabel>{t('Integration_Outgoing_WebHook_History_Error_Stacktrace')}</FieldLabel>
						<FieldRow>
							<Box withRichContent w='full'>
								<pre>
									<code dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(errorStackCode) }}></code>
								</pre>
							</Box>
						</FieldRow>
					</Field>
				)}
			</FieldGroup>
		</AccordionItem>
	);
};

export default HistoryItem;
