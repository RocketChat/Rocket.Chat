import type { IOutgoingIntegration, Serialized } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useTranslation, useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import GenericModal from '../../../../components/GenericModal';
import Page from '../../../../components/Page';
import { triggerWordsToArray, triggerWordsToString } from '../helpers/triggerWords';
import { useCreateIntegration } from '../hooks/useCreateIntegration';
import { useDeleteIntegration } from '../hooks/useDeleteIntegration';
import { useUpdateIntegration } from '../hooks/useUpdateIntegration';
import OutgoingWebhookForm from './OutgoingWebhookForm';

const getInitialValue = (webhookData: Serialized<IOutgoingIntegration> | undefined, defaultToken: string) => ({
	enabled: webhookData?.enabled || true,
	impersonateUser: webhookData?.impersonateUser || false,
	event: webhookData?.event || 'sendMessage',
	urls: webhookData?.urls?.join('\n') ?? '',
	token: webhookData?.token || defaultToken,
	triggerWords: triggerWordsToString(webhookData?.triggerWords) || '',
	targetRoom: webhookData?.targetRoom || '',
	channel: webhookData?.channel.join(', ') || '',
	username: webhookData?.username || '',
	name: webhookData?.name || '',
	alias: webhookData?.alias || '',
	avatar: webhookData?.avatar || '',
	emoji: webhookData?.emoji || '',
	scriptEnabled: webhookData?.scriptEnabled || false,
	scriptEngine: webhookData?.scriptEngine || 'isolated-vm',
	script: webhookData?.script || '',
	retryFailedCalls: webhookData?.retryFailedCalls || true,
	retryCount: webhookData?.retryCount || 6,
	retryDelay: webhookData?.retryDelay || 'powers-of-ten',
	triggerWordAnywhere: webhookData?.triggerWordAnywhere || false,
	runOnEdits: webhookData?.runOnEdits || true,
});

const OUTGOING_TYPE = 'webhook-outgoing';

const EditOutgoingWebhook = ({ webhookData }: { webhookData?: Serialized<IOutgoingIntegration> }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const router = useRouter();

	const tab = useRouteParameter('type');

	const defaultToken = useUniqueId();

	const methods = useForm({ mode: 'onBlur', values: getInitialValue(webhookData, defaultToken) });
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
		async ({ ...formValues }) => {
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

	const formId = useUniqueId();

	return (
		<Page flexDirection='column'>
			<Page.Header title={t('Integration_Outgoing_WebHook')}>
				<ButtonGroup>
					<Button icon='back' onClick={() => router.navigate('/admin/integrations/webhook-outgoing')}>
						{t('Back')}
					</Button>
					{webhookData?._id && (
						<Button onClick={() => router.navigate(`/admin/integrations/history/outgoing/${webhookData._id}`)}>{t('History')}</Button>
					)}
					{webhookData?._id && (
						<Button danger onClick={handleDeleteIntegration}>
							{t('Delete')}
						</Button>
					)}
				</ButtonGroup>
			</Page.Header>
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
			<Page.ScrollableContentWithShadow is='form' id={formId} onSubmit={handleSubmit(handleSave)}>
				<FormProvider {...methods}>
					<OutgoingWebhookForm />
				</FormProvider>
			</Page.ScrollableContentWithShadow>
			<Page.Footer isDirty={isDirty}>
				<ButtonGroup>
					<Button type='reset' onClick={() => reset()}>
						{t('Cancel')}
					</Button>
					<Button form={formId} primary type='submit'>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Footer>
		</Page>
	);
};

export default EditOutgoingWebhook;
