import { Field, Button } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback } from 'react';

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

	const { values: formValues, handlers: formHandlers } = useForm({ ...data, token: useUniqueId() });

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
					<Button w='full' mie='none' flexGrow={1} onClick={handleSave}>
						{t('Save')}
					</Button>
				</Field.Row>
			</Field>
		),
		[handleSave, t],
	);

	return <OutgoingWebhookForm formValues={formValues} formHandlers={formHandlers} append={saveButton} {...props} />;
}
