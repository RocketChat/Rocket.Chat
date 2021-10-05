import { Field, Box, Margins, Button } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback } from 'react';

import DeleteSuccessModal from '../../../../components/DeleteSuccessModal';
import DeleteWarningModal from '../../../../components/DeleteWarningModal';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useRoute } from '../../../../contexts/RouterContext';
import { useMethod } from '../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useForm } from '../../../../hooks/useForm';
import OutgoingWebhookForm from '../OutgoiongWebhookForm';
import { triggerWordsToArray, triggerWordsToString } from '../helpers/triggerWords';

const getInitialValue = (data) => {
	const initialValue = {
		enabled: data.enabled ?? true,
		impersonateUser: data.impersonateUser,
		event: data.event,
		token: data.token,
		urls: data.urls.join('\n') ?? '',
		triggerWords: triggerWordsToString(data.triggerWords),
		targetRoom: data.targetRoom ?? '',
		channel: data.channel.join(', ') ?? '',
		username: data.username ?? '',
		name: data.name ?? '',
		alias: data.alias ?? '',
		avatarUrl: data.avatarUrl ?? '',
		emoji: data.emoji ?? '',
		scriptEnabled: data.scriptEnabled ?? false,
		script: data.script ?? '',
		retryFailedCalls: data.retryFailedCalls ?? true,
		retryCount: data.retryCount ?? 5,
		retryDelay: data.retryDelay ?? 'power-of-ten',
		triggerrWordAnywhere: data.triggerrWordAnywhere ?? false,
		runOnEdits: data.runOnEdits ?? true,
	};
	return initialValue;
};

function EditOutgoingWebhook({ data, onChange, setSaveAction, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { handlers: formHandlers, values: formValues, reset } = useForm(getInitialValue(data));
	const setModal = useSetModal();

	const saveIntegration = useMethod('updateOutgoingIntegration');

	const router = useRoute('admin-integrations');

	const deleteQuery = useMemo(() => ({ type: 'webhook-outgoing', integrationId: data._id }), [
		data._id,
	]);
	const deleteIntegration = useEndpointAction('POST', 'integrations.remove', deleteQuery);

	const handleDeleteIntegration = useCallback(() => {
		const closeModal = () => setModal();
		const onDelete = async () => {
			const result = await deleteIntegration();
			if (result.success) {
				setModal(
					<DeleteSuccessModal
						children={t('Your_entry_has_been_deleted')}
						onClose={() => {
							closeModal();
							router.push({});
						}}
					/>,
				);
			}
		};

		setModal(
			<DeleteWarningModal
				children={t('Integration_Delete_Warning')}
				onDelete={onDelete}
				onCancel={closeModal}
			/>,
		);
	}, [deleteIntegration, router, setModal, t]);

	const { urls, triggerWords } = formValues;

	const handleSave = useCallback(async () => {
		try {
			await saveIntegration(data._id, {
				...formValues,
				triggerWords: triggerWordsToArray(triggerWords),
				urls: urls.split('\n'),
			});

			dispatchToastMessage({ type: 'success', message: t('Integration_updated') });
			onChange();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	}, [
		data._id,
		dispatchToastMessage,
		formValues,
		onChange,
		saveIntegration,
		t,
		triggerWords,
		urls,
	]);

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
		<OutgoingWebhookForm
			formValues={formValues}
			formHandlers={formHandlers}
			append={actionButtons}
			{...props}
		/>
	);
}

export default EditOutgoingWebhook;
