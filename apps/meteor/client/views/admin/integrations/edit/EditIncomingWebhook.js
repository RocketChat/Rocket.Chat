import { Field, Box, Margins, Button } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';
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
		avatar: data.avatar ?? '',
		emoji: data.emoji ?? '',
		scriptEnabled: data.scriptEnabled,
		overrideDestinationChannelEnabled: data.overrideDestinationChannelEnabled,
		script: data.script,
	};
	return initialValue;
};

function EditIncomingWebhook({ data, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { values: formValues, handlers: formHandlers, reset } = useForm(getInitialValue(data));
	const setModal = useSetModal();

	const deleteIntegration = useEndpointAction('POST', '/v1/integrations.remove');
	const saveIntegration = useMethod('updateIncomingIntegration');

	const router = useRoute('admin-integrations');

	const handleDeleteIntegration = useCallback(() => {
		const closeModal = () => setModal();

		const handleClose = () => {
			closeModal();
			router.push({});
		};

		const onDelete = async () => {
			const result = await deleteIntegration({ type: 'webhook-incoming', integrationId: data._id });
			if (result.success) {
				setModal(
					<GenericModal variant='success' onClose={handleClose} onConfirm={handleClose}>
						{t('Your_entry_has_been_deleted')}
					</GenericModal>,
				);
			}
		};

		setModal(
			<GenericModal variant='danger' onConfirm={onDelete} onCancel={closeModal} confirmText={t('Delete')}>
				{t('Integration_Delete_Warning')}
			</GenericModal>,
		);
	}, [data._id, deleteIntegration, router, setModal, t]);

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
					<Button mbs={4} danger w='full' onClick={handleDeleteIntegration}>
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
