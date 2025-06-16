import type { IOutgoingIntegration, OutgoingIntegrationEvent, Serialized } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation, useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useId, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import OutgoingWebhookForm from './OutgoingWebhookForm';
import GenericModal from '../../../../components/GenericModal';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../../components/Page';
import { triggerWordsToArray, triggerWordsToString } from '../helpers/triggerWords';
import { useCreateIntegration } from '../hooks/useCreateIntegration';
import { useDeleteIntegration } from '../hooks/useDeleteIntegration';
import { useUpdateIntegration } from '../hooks/useUpdateIntegration';

type EditOutgoingWebhookFormData = {
	enabled: boolean;
	impersonateUser: boolean;
	event: OutgoingIntegrationEvent;
	urls: string;
	token: string;
	triggerWords: string;
	targetRoom: string;
	channel: string;
	username: string;
	name: string;
	alias: string;
	avatar: string;
	emoji: string;
	scriptEnabled: boolean;
	scriptEngine: 'isolated-vm';
	script: string;
	retryFailedCalls: boolean;
	retryCount: number;
	retryDelay: string;
	triggerWordAnywhere: boolean;
	runOnEdits: boolean;
};

const getInitialValue = (webhookData: Serialized<IOutgoingIntegration> | undefined, defaultToken: string): EditOutgoingWebhookFormData => ({
	enabled: webhookData?.enabled ?? true,
	impersonateUser: webhookData?.impersonateUser ?? false,
	event: webhookData?.event ?? 'sendMessage',
	urls: webhookData?.urls?.join('\n') ?? '',
	token: webhookData?.token ?? defaultToken,
	triggerWords: triggerWordsToString(webhookData?.triggerWords) ?? '',
	targetRoom: webhookData?.targetRoom ?? '',
	channel: webhookData?.channel.join(', ') ?? '',
	username: webhookData?.username ?? '',
	name: webhookData?.name ?? '',
	alias: webhookData?.alias ?? '',
	avatar: webhookData?.avatar ?? '',
	emoji: webhookData?.emoji ?? '',
	scriptEnabled: webhookData?.scriptEnabled ?? false,
	scriptEngine: webhookData?.scriptEngine ?? 'isolated-vm',
	script: webhookData?.script ?? '',
	retryFailedCalls: webhookData?.retryFailedCalls ?? true,
	retryCount: webhookData?.retryCount ?? 6,
	retryDelay: webhookData?.retryDelay ?? 'powers-of-ten',
	triggerWordAnywhere: webhookData?.triggerWordAnywhere ?? false,
	runOnEdits: webhookData?.runOnEdits ?? true,
});

const OUTGOING_TYPE = 'webhook-outgoing';

type EditOutgoingWebhookProps = {
	webhookData?: Serialized<IOutgoingIntegration>;
};

const EditOutgoingWebhook = ({ webhookData }: EditOutgoingWebhookProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const router = useRouter();

	const tab = useRouteParameter('type');

	const defaultToken = useId();

	const methods = useForm<EditOutgoingWebhookFormData>({ mode: 'onBlur', values: getInitialValue(webhookData, defaultToken) });
	const {
		reset,
		handleSubmit,
		formState: { isDirty },
		watch,
	} = methods;

	const deleteIntegration = useDeleteIntegration(OUTGOING_TYPE);
	const createIntegration = useCreateIntegration(OUTGOING_TYPE);
	const updateIntegration = useUpdateIntegration(OUTGOING_TYPE);

	const handleDeleteIntegration = useCallback(() => {
		const onDelete = async () => {
			deleteIntegration.mutate({ type: OUTGOING_TYPE, integrationId: webhookData?._id });
		};

		setModal(
			<GenericModal variant='danger' onConfirm={onDelete} onCancel={() => setModal(null)} confirmText={t('Delete')}>
				{t('Integration_Delete_Warning')}
			</GenericModal>,
		);
	}, [webhookData?._id, deleteIntegration, setModal, t]);

	const { urls, triggerWords } = watch();

	const handleSave = useCallback(
		async (formValues: EditOutgoingWebhookFormData) => {
			if (webhookData?._id) {
				return updateIntegration.mutate({
					type: OUTGOING_TYPE,
					integrationId: webhookData?._id,
					...formValues,
					triggerWords: triggerWordsToArray(triggerWords),
					urls: urls.split('\n'),
				});
			}

			return createIntegration.mutate({
				type: OUTGOING_TYPE,
				...formValues,
				triggerWords: triggerWordsToArray(triggerWords),
				urls: urls.split('\n'),
			});
		},
		[webhookData?._id, createIntegration, updateIntegration, triggerWords, urls],
	);

	const formId = useId();

	return (
		<Page flexDirection='column'>
			<PageHeader title={t('Integration_Outgoing_WebHook')} onClickBack={() => router.navigate('/admin/integrations/webhook-outgoing')}>
				<ButtonGroup>
					{webhookData?._id && (
						<Button onClick={() => router.navigate(`/admin/integrations/history/outgoing/${webhookData._id}`)}>{t('History')}</Button>
					)}
					{webhookData?._id && (
						<Button danger onClick={handleDeleteIntegration}>
							{t('Delete')}
						</Button>
					)}
				</ButtonGroup>
			</PageHeader>
			{!webhookData?._id && (
				<Tabs>
					<TabsItem selected={tab === 'incoming'} onClick={() => router.navigate('/admin/integrations/new/incoming')}>
						{t('Incoming')}
					</TabsItem>
					<TabsItem selected={tab === 'outgoing'} onClick={() => router.navigate('/admin/integrations/new/outgoing')}>
						{t('Outgoing')}
					</TabsItem>
				</Tabs>
			)}
			<PageScrollableContentWithShadow is='form' id={formId} onSubmit={handleSubmit(handleSave)}>
				<FormProvider {...methods}>
					<OutgoingWebhookForm />
				</FormProvider>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button type='reset' onClick={() => reset()}>
						{t('Cancel')}
					</Button>
					<Button form={formId} primary type='submit'>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default EditOutgoingWebhook;
