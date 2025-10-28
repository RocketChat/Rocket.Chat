import type { SettingValue } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	Box,
	FieldGroup,
	Field,
	FieldRow,
	TextInput,
	MultiSelect,
	Button,
	ButtonGroup,
	NumberInput,
	FieldLabel,
} from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';

type WebhooksPageProps = {
	settings: Record<string, SettingValue>;
};

type SendOnOptions =
	| 'Livechat_webhook_on_start'
	| 'Livechat_webhook_on_close'
	| 'Livechat_webhook_on_chat_taken'
	| 'Livechat_webhook_on_chat_queued'
	| 'Livechat_webhook_on_forward'
	| 'Livechat_webhook_on_offline_msg'
	| 'Livechat_webhook_on_visitor_message'
	| 'Livechat_webhook_on_agent_message';

type WebhooksPageFormData = {
	Livechat_webhookUrl: string;
	Livechat_secret_token: string;
	Livechat_http_timeout: string;
	sendOn: SendOnOptions[];
};

const reduceSendOptions = (options: Record<string, SettingValue>) =>
	Object.entries(options).reduce<string[]>((acc, [key, val]) => {
		if (val) {
			acc = [...acc, key];
		}
		return acc;
	}, []);

const INTEGRATION_URL = 'https://docs.rocket.chat/use-rocket.chat/omnichannel/webhooks';

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
}: WebhooksPageProps['settings']): WebhooksPageFormData => {
	const mappedSendOptions = reduceSendOptions({
		Livechat_webhook_on_start,
		Livechat_webhook_on_close,
		Livechat_webhook_on_chat_taken,
		Livechat_webhook_on_chat_queued,
		Livechat_webhook_on_forward,
		Livechat_webhook_on_offline_msg,
		Livechat_webhook_on_visitor_message,
		Livechat_webhook_on_agent_message,
	});

	return {
		Livechat_webhookUrl,
		Livechat_secret_token,
		Livechat_http_timeout,
		sendOn: mappedSendOptions,
	} as WebhooksPageFormData;
};

const WebhooksPage = ({ settings }: WebhooksPageProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const defaultValues = getInitialValues(settings);
	const {
		control,
		reset,
		formState: { isDirty, isSubmitting },
		handleSubmit,
	} = useForm({
		defaultValues,
	});

	const save = useEndpoint('POST', '/v1/omnichannel/integrations');
	const test = useEndpoint('POST', '/v1/livechat/webhook.test');

	const livechatWebhookUrl = useWatch({ name: 'Livechat_webhookUrl', control });
	const canTest = !(livechatWebhookUrl && !isDirty);

	const sendOptions = useMemo<SelectOption[]>(
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

	const handleSave = useEffectEvent(async (values: WebhooksPageFormData) => {
		const { sendOn, Livechat_webhookUrl, Livechat_secret_token, Livechat_http_timeout } = values;
		try {
			await save({
				LivechatWebhookUrl: Livechat_webhookUrl,
				LivechatSecretToken: Livechat_secret_token,
				LivechatHttpTimeout: parseInt(Livechat_http_timeout, 10),
				LivechatWebhookOnStart: sendOn.includes('Livechat_webhook_on_start'),
				LivechatWebhookOnClose: sendOn.includes('Livechat_webhook_on_close'),
				LivechatWebhookOnChatTaken: sendOn.includes('Livechat_webhook_on_chat_taken'),
				LivechatWebhookOnChatQueued: sendOn.includes('Livechat_webhook_on_chat_queued'),
				LivechatWebhookOnForward: sendOn.includes('Livechat_webhook_on_forward'),
				LivechatWebhookOnOfflineMsg: sendOn.includes('Livechat_webhook_on_offline_msg'),
				LivechatWebhookOnVisitorMessage: sendOn.includes('Livechat_webhook_on_visitor_message'),
				LivechatWebhookOnAgentMessage: sendOn.includes('Livechat_webhook_on_agent_message'),
			});

			reset(values);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const testWebhook = useMutation({
		mutationFn: () => test(),
		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('It_works') }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	return (
		<Page>
			<PageHeader title={t('Webhooks')}>
				<ButtonGroup>
					<Button onClick={() => reset()} disabled={!isDirty || isSubmitting}>
						{t('Reset')}
					</Button>
					<Button
						onClick={() => testWebhook.mutateAsync()}
						disabled={canTest || testWebhook.isPending}
						title={canTest ? t('Webhook_URL_not_set') : ''}
					>
						{testWebhook.isPending ? t('Sending') : t('Send_Test')}
					</Button>
					<Button primary onClick={handleSubmit(handleSave)} loading={isSubmitting} disabled={!isDirty}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</PageHeader>
			<PageScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<p>{t('You_can_use_webhooks_to_easily_integrate_livechat_with_your_CRM')}</p>
					<p>
						<ExternalLink to={INTEGRATION_URL}>{t('Click_here')}</ExternalLink> {t('to_see_more_details_on_how_to_integrate')}
					</p>
					<FieldGroup style={{ marginTop: '1.5rem' }}>
						<Field>
							<FieldLabel>{t('Webhook_URL')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='Livechat_webhookUrl'
									render={({ field: { onChange, value } }) => (
										<TextInput onChange={onChange} value={value} placeholder='https://yourdomain.com/webhook/entrypoint' />
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel>{t('Secret_token')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='Livechat_secret_token'
									render={({ field: { onChange, value } }) => (
										<TextInput onChange={onChange} value={value} placeholder={t('Secret_token')} />
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel>{t('Send_request_on')}</FieldLabel>
							<FieldRow>
								<Box w='full' display='flex' alignItems='stretch' justifyContent='stretch'>
									<Controller
										control={control}
										name='sendOn'
										render={({ field: { onChange, value } }) => (
											<MultiSelect w='full' value={value} onChange={onChange} options={sendOptions} placeholder={t('Select_an_option')} />
										)}
									/>
								</Box>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel>{t('Http_timeout')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='Livechat_http_timeout'
									render={({ field: { onChange, value } }) => (
										<NumberInput onChange={onChange} value={value} placeholder={t('Http_timeout_value')} />
									)}
								/>
							</FieldRow>
						</Field>
					</FieldGroup>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default WebhooksPage;
