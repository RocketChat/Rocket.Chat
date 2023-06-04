import { Box, FieldGroup, Field, TextInput, MultiSelect, Button, ButtonGroup, NumberInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import Page from '../../../components/Page';
import { useForm } from '../../../hooks/useForm';

const reduceSendOptions = (options) =>
	Object.entries(options).reduce((acc, [key, val]) => {
		if (val) {
			acc = [...acc, key];
		}
		return acc;
	}, []);

const integrationsUrl = 'https://docs.rocket.chat/use-rocket.chat/omnichannel/webhooks';

const getInitialValues = ({
	Livechat_webhookUrl,
	Livechat_secret_token,
	Livechat_webhook_on_start,
	Livechat_webhook_on_close,
	Livechat_webhook_on_chat_taken,
	Livechat_webhook_on_chat_queued,
	Livechat_webhook_on_forward,
	Livechat_webhook_on_offline_msg,
	Livechat_webhook_on_visitor_message,
	Livechat_webhook_on_agent_message,
	Livechat_http_timeout,
}) => {
	const sendOptions = {
		Livechat_webhook_on_start,
		Livechat_webhook_on_close,
		Livechat_webhook_on_chat_taken,
		Livechat_webhook_on_chat_queued,
		Livechat_webhook_on_forward,
		Livechat_webhook_on_offline_msg,
		Livechat_webhook_on_visitor_message,
		Livechat_webhook_on_agent_message,
	};

	const mappedSendOptions = reduceSendOptions(sendOptions);

	return {
		Livechat_webhookUrl,
		Livechat_secret_token,
		Livechat_http_timeout,
		sendOn: mappedSendOptions,
	};
};

const WebhooksPage = ({ settings }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers, hasUnsavedChanges, reset, commit } = useForm(getInitialValues(settings));

	const save = useEndpoint('POST', '/v1/omnichannel/integrations');
	const test = useEndpoint('POST', '/v1/livechat/webhook.test');

	const { Livechat_webhookUrl, Livechat_secret_token, Livechat_http_timeout, sendOn } = values;

	const { handleLivechat_webhookUrl, handleLivechat_secret_token, handleLivechat_http_timeout, handleSendOn } = handlers;

	const sendOptions = useMemo(
		() => [
			['Livechat_webhook_on_start', t('Chat_start')],
			['Livechat_webhook_on_close', t('Chat_close')],
			['Livechat_webhook_on_chat_taken', t('Chat_taken')],
			['Livechat_webhook_on_chat_queued', t('Chat_queued')],
			['Livechat_webhook_on_forward', t('Forwarding')],
			['Livechat_webhook_on_offline_msg', t('Offline_messages')],
			['Livechat_webhook_on_visitor_message', t('Visitor_message')],
			['Livechat_webhook_on_agent_message', t('Agent_messages')],
		],
		[t],
	);

	const handleSave = useMutableCallback(async () => {
		try {
			await save({
				LivechatWebhookUrl: Livechat_webhookUrl,
				LivechatSecretToken: Livechat_secret_token,
				LivechatHttpTimeout: Livechat_http_timeout,
				LivechatWebhookOnStart: sendOn.includes('Livechat_webhook_on_start'),
				LivechatWebhookOnClose: sendOn.includes('Livechat_webhook_on_close'),
				LivechatWebhookOnChatTaken: sendOn.includes('Livechat_webhook_on_chat_taken'),
				LivechatWebhookOnChatQueued: sendOn.includes('Livechat_webhook_on_chat_queued'),
				LivechatWebhookOnForward: sendOn.includes('Livechat_webhook_on_forward'),
				LivechatWebhookOnOfflineMsg: sendOn.includes('Livechat_webhook_on_offline_msg'),
				LivechatWebhookOnVisitorMessage: sendOn.includes('Livechat_webhook_on_visitor_message'),
				LivechatWebhookOnAgentMessage: sendOn.includes('Livechat_webhook_on_agent_message'),
			});
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			commit();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleTest = useMutableCallback(async () => {
		try {
			await test();
			dispatchToastMessage({ type: 'success', message: t('It_works') });
			commit();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return (
		<Page>
			<Page.Header title={t('Webhooks')}>
				<ButtonGroup>
					<Button onClick={() => reset()}>{t('Reset')}</Button>
					<Button onClick={handleTest} disabled={!Livechat_webhookUrl || hasUnsavedChanges}>
						{t('Send_Test')}
					</Button>
					<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<p>{t('You_can_use_webhooks_to_easily_integrate_livechat_with_your_CRM')}</p>
					<p>
						<ExternalLink to={integrationsUrl}>{t('Click_here')}</ExternalLink> {t('to_see_more_details_on_how_to_integrate')}
					</p>
					<FieldGroup style={{ marginTop: '1.5rem' }}>
						<Field>
							<Field.Label>{t('Webhook_URL')}</Field.Label>
							<Field.Row>
								<TextInput
									value={Livechat_webhookUrl}
									onChange={handleLivechat_webhookUrl}
									placeholder='https://yourdomain.com/webhook/entrypoint'
								/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Secret_token')}</Field.Label>
							<Field.Row>
								<TextInput value={Livechat_secret_token} onChange={handleLivechat_secret_token} placeholder={t('Secret_token')} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Send_request_on')}</Field.Label>
							<Field.Row>
								<Box w='full' display='flex' alignItems='stretch' justifyContent='stretch'>
									<MultiSelect w='full' value={sendOn} onChange={handleSendOn} options={sendOptions} placeholder={t('Select_an_option')} />
								</Box>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Http_timeout')}</Field.Label>
							<Field.Row>
								<NumberInput value={Livechat_http_timeout} onChange={handleLivechat_http_timeout} placeholder={t('Http_timeout_value')} />
							</Field.Row>
						</Field>
					</FieldGroup>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default WebhooksPage;
