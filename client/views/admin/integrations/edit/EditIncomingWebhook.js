import React, { useMemo, useCallback } from 'react';
import { Field, Box, Skeleton, Margins, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { useMethod } from '../../../../contexts/ServerContext';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useRoute } from '../../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useForm } from '../../../../hooks/useForm';
import IncomingWebhookForm from '../IncomingWebhookForm';
import DeleteSuccessModal from '../../../../components/DeleteSuccessModal';
import DeleteWarningModal from '../../../../components/DeleteWarningModal';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';

export default function EditIncomingWebhookWithData({ integrationId, ...props }) {
	const t = useTranslation();

	const params = useMemo(() => ({ integrationId }), [integrationId]);
	const { value: data, phase: state, error, reload } = useEndpointData('integrations.get', params);

	const onChange = () => {
		reload();
	};

	if (state === AsyncStatePhase.LOADING) {
		return <Box w='full' pb='x24' {...props}>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (error) {
		return <Box mbs='x16' {...props}>{t('Oops_page_not_found')}</Box>;
	}

	return <EditIncomingWebhook data={data.integration} onChange={onChange} {...props}/>;
}

const getInitialValue = (data) => {
	const initialValue = {
		enabled: data.enabled,
		channel: data.channel.join(', ') ?? '',
		username: data.username ?? '',
		name: data.name ?? '',
		alias: data.alias ?? '',
		avatarUrl: data.avatarUrl ?? '',
		emoji: data.emoji ?? '',
		scriptEnabled: data.scriptEnabled,
		script: data.script,
	};
	return initialValue;
};

function EditIncomingWebhook({ data, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { values: formValues, handlers: formHandlers, reset } = useForm(getInitialValue(data));
	const setModal = useSetModal();

	const deleteQuery = useMemo(() => ({ type: 'webhook-incoming', integrationId: data._id }), [data._id]);
	const deleteIntegration = useEndpointAction('POST', 'integrations.remove', deleteQuery);
	const saveIntegration = useMethod('updateIncomingIntegration');

	const router = useRoute('admin-integrations');

	const handleDeleteIntegration = useCallback(() => {
		const closeModal = () => setModal();
		const onDelete = async () => {
			const result = await deleteIntegration();
			if (result.success) {
				setModal(<DeleteSuccessModal
					children={t('Your_entry_has_been_deleted')}
					onClose={() => { closeModal(); router.push({}); }}
				/>);
			}
		};

		setModal(<DeleteWarningModal
			children={t('Integration_Delete_Warning')}
			onDelete={onDelete}
			onCancel={closeModal}
		/>);
	}, [deleteIntegration, router, setModal, t]);

	const handleSave = useCallback(async () => {
		try {
			await saveIntegration(data._id, { ...formValues });
			dispatchToastMessage({ type: 'success', message: t('Integration_updated') });
			onChange();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	}, [data._id, dispatchToastMessage, formValues, onChange, saveIntegration, t]);

	const actionButtons = useMemo(() => <Field>
		<Field.Row display='flex' flexDirection='column'>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Margins inlineEnd='x4'>
					<Button flexGrow={1} type='reset' onClick={reset}>{t('Reset')}</Button>
					<Button mie='none' flexGrow={1} onClick={handleSave}>{t('Save')}</Button>
				</Margins>
			</Box>
			<Button mbs='x4' primary danger w='full' onClick={handleDeleteIntegration} >{t('Delete')}</Button>
		</Field.Row>
	</Field>, [handleDeleteIntegration, handleSave, reset, t]);


	return <IncomingWebhookForm formHandlers={formHandlers} formValues={formValues} extraData={{ _id: data._id, token: data.token }} append={actionButtons} {...props}/>;
}
