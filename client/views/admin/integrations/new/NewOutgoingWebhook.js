import { Field, Box, Margins, Button } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback } from 'react';

import { useRoute } from '../../../../contexts/RouterContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useForm } from '../../../../hooks/useForm';
import OutgoingWebhookForm from '../OutgoiongWebhookForm';
import { triggerWordsToArray } from '../helpers/triggerWords';

const defaultData = {
	type: 'webhook-outgoing',
	enabled: true,
	impersonateUser: false,
	event: 'sendMessage',
	urls: '',
	triggerWords: '',
	targetRoom: '',
	channel: '',
	username: '',
	name: '',
	alias: '',
	avatar: '',
	emoji: '',
	scriptEnabled: false,
	script: '',
	retryFailedCalls: true,
	retryCount: 6,
	retryDelay: 'powers-of-ten',
	triggerWordAnywhere: false,
	runOnEdits: true,
};

export default function NewOutgoingWebhook({ data = defaultData, onChange, setSaveAction, ...props }) {
	const t = useTranslation();
	const router = useRoute('admin-integrations');

	const { values: formValues, handlers: formHandlers, hasUnsavedChanges, reset } = useForm({ ...data, token: useUniqueId() });

	const { urls, triggerWords } = formValues;

	const params = useMemo(
		() => ({
			...formValues,
			urls: urls.split('\n'),
			triggerWords: triggerWordsToArray(triggerWords),
		}),
		[formValues, triggerWords, urls],
	);
	const saveIntegration = useEndpointAction('POST', 'integrations.create', params, t('Integration_added'));

	const handleSave = useCallback(async () => {
		const result = await saveIntegration();
		if (result.success) {
			router.push({ id: result.integration._id, context: 'edit', type: 'outgoing' });
		}
	}, [saveIntegration, router]);

	const saveButton = useMemo(
		() => (
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Margins inlineEnd='x4'>
							<Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges} onClick={reset}>
								{t('Reset')}
							</Button>
							<Button mie='none' flexGrow={1} primary disabled={!hasUnsavedChanges} onClick={handleSave}>
								{t('Save')}
							</Button>
						</Margins>
					</Box>
				</Field.Row>
			</Field>
		),
		[handleSave, t],
	);

	return <OutgoingWebhookForm formValues={formValues} formHandlers={formHandlers} append={saveButton} {...props} />;
}
