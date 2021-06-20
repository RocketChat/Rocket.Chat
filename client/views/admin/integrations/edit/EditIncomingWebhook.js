import { Field, Box, Margins, Button } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useRoute } from '../../../../contexts/RouterContext';
import { useMethod } from '../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useForm } from '../../../../hooks/useForm';
import IncomingWebhookForm from '../IncomingWebhookForm';

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

	const deleteQuery = useMemo(() => ({ type: 'webhook-incoming', integrationId: data._id }), [
		data._id,
	]);
	const deleteIntegration = useEndpointAction('POST', 'integrations.remove', deleteQuery);
	const saveIntegration = useMethod('updateIncomingIntegration');

	const router = useRoute('admin-integrations');

	const handleDeleteIntegration = useCallback(() => {
		const closeModal = () => setModal();

		const handleClose = () => {
			closeModal();
			router.push({});
		};

		const onDelete = async () => {
			const result = await deleteIntegration();
			if (result.success) {
				setModal(
					<GenericModal variant='success' onClose={handleClose} onConfirm={handleClose}>
						{t('Your_entry_has_been_deleted')}
					</GenericModal>,
				);
			}
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDelete}
				onCancel={closeModal}
				confirmText={t('Delete')}
			>
				{t('Integration_Delete_Warning')}
			</GenericModal>,
		);
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

	const actionButtons = useMemo(
		() => (
			<Field>
				<Field.Row display='flex' flexDirection='column'>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Margins inlineEnd='x4'>
							<Button flexGrow={1} type='reset' onClick={reset}>
								{t('Reset')}
							</Button>
							<Button mie='none' flexGrow={1} onClick={handleSave}>
								{t('Save')}
							</Button>
						</Margins>
					</Box>
					<Button mbs='x4' primary danger w='full' onClick={handleDeleteIntegration}>
						{t('Delete')}
					</Button>
				</Field.Row>
			</Field>
		),
		[handleDeleteIntegration, handleSave, reset, t],
	);

	return (
		<IncomingWebhookForm
			formHandlers={formHandlers}
			formValues={formValues}
			extraData={{ _id: data._id, token: data.token }}
			append={actionButtons}
			{...props}
		/>
	);
}

export default EditIncomingWebhook;
