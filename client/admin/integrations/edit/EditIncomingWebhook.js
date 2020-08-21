import React, { useMemo, useState, useCallback } from 'react';
import { Field, Box, Skeleton, Margins, Button } from '@rocket.chat/fuselage';

import { SuccessModal, DeleteWarningModal } from './EditIntegrationsPage';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useMethod } from '../../../contexts/ServerContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useRoute } from '../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { useForm } from '../../../hooks/useForm';
import IncomingWebhookForm from '../IncomingWebhookForm';

export default function EditIncomingWebhookWithData({ integrationId, ...props }) {
	const t = useTranslation();
	const [cache, setCache] = useState();

	// TODO: remove cache. Is necessary for data validation
	const { data, state, error } = useEndpointDataExperimental('integrations.get', useMemo(() => ({ integrationId }), [integrationId, cache]));

	const onChange = () => setCache(new Date());

	if (state === ENDPOINT_STATES.LOADING) {
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
			if (result.success) { setModal(<SuccessModal onClose={() => { closeModal(); router.push({}); }}/>); }
		};

		setModal(<DeleteWarningModal onDelete={onDelete} onCancel={closeModal} />);
	}, [deleteIntegration, router]);

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
