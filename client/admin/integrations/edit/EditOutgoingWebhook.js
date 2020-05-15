import React, { useMemo, useState } from 'react';
import {
	Field,
	Box,
	Headline,
	Skeleton,
	Margins,
	Button,
} from '@rocket.chat/fuselage';

import { SuccessModal, DeleteWarningModal } from './EditIntegrationsPage';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import OutgoingWebhookForm from '../OutgoiongWebhookForm';
import { useForm } from '../../../hooks/useForm';

export default function EditOutgoingWebhookWithData({ integrationId, ...props }) {
	const t = useTranslation();
	const [cache, setCache] = useState();

	const { data, state, error } = useEndpointDataExperimental('integrations.get', useMemo(() => ({ integrationId }), [integrationId, cache]));

	const onChange = () => setCache(new Date());

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24' {...props}>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (error) {
		return <Box mbs='x16' {...props}>{t('Oops_page_not_found')}</Box>;
	}

	return <EditOutgoingWebhook data={data.integration} onChange={onChange} {...props}/>;
}

const getInitialValue = (data) => {
	const initialValue = {
		enabled: data.enabled ?? true,
		impersonateUser: data.impersonateUser,
		event: data.event,
		token: data.token,
		urls: data.urls.join('\n') ?? '',
		triggerWords: data.triggerWords?.join('; ') ?? '',
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
	const [modal, setModal] = useState();

	const saveIntegration = useMethod('updateOutgoingIntegration');

	const router = useRoute('admin-integrations');

	const deleteQuery = useMemo(() => ({ type: 'webhook-outgoing', integrationId: data._id }), [data._id]);
	const deleteIntegration = useEndpointAction('POST', 'integrations.remove', deleteQuery);

	const handleDeleteIntegration = () => {
		const closeModal = () => setModal();
		const onDelete = async () => {
			const result = await deleteIntegration();
			if (result.success) { setModal(<SuccessModal onClose={() => { closeModal(); router.push({}); }}/>); }
		};

		setModal(<DeleteWarningModal onDelete={onDelete} onCancel={closeModal} />);
	};

	const {
		urls,
		triggerWords,
	} = formValues;

	const handleSave = async () => {
		try {
			await saveIntegration(data._id, {
				...formValues,
				triggerWords: triggerWords.split(';'),
				urls: urls.split('\n'),
			});

			dispatchToastMessage({ type: 'success', message: t('Integration_updated') });
			onChange();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	const actionButtons = useMemo(() => <Field>
		<Field.Row display='flex' flexDirection='column'>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Margins inlineEnd='x4'>
					<Button flexGrow={1} type='reset' onClick={reset}>{t('Reset')}</Button>
					<Button mie='none' flexGrow={1} onClick={handleSave}>{t('Save')}</Button>
				</Margins>
			</Box>
			<Button mbs='x4' primary danger w='full' onClick={handleDeleteIntegration}>{t('Delete')}</Button>
		</Field.Row>
	</Field>);


	return <>
		<OutgoingWebhookForm formValues={formValues} formHandlers={formHandlers} append={actionButtons} {...props}/>
		{ modal }
	</>;
}
