import { Field, Box, Margins, Button } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo } from 'react';

import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useForm } from '../../../../hooks/useForm';
import IncomingWebhookForm from '../IncomingWebhookForm';

const initialState = {
	enabled: false,
	channel: '',
	username: '',
	name: '',
	alias: '',
	avatar: '',
	emoji: '',
	scriptEnabled: false,
	scriptEngine: 'isolated-vm',
	overrideDestinationChannelEnabled: false,
	script: '',
};

export default function NewIncomingWebhook(props) {
	const t = useTranslation();

	const router = useRoute('admin-integrations');

	const { values: formValues, handlers: formHandlers, reset } = useForm(initialState);

	const saveAction = useEndpointAction('POST', '/v1/integrations.create', { successMessage: t('Integration_added') });

	const handleSave = useCallback(async () => {
		const result = await saveAction({ ...formValues, type: 'webhook-incoming' });
		if (result.success) {
			router.push({ context: 'edit', type: 'incoming', id: result.integration._id });
		}
	}, [formValues, router, saveAction]);

	const actionButtons = useMemo(
		() => (
			<Field>
				<Field.Row>
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
				</Field.Row>
			</Field>
		),
		[handleSave, reset, t],
	);

	return <IncomingWebhookForm formValues={formValues} formHandlers={formHandlers} append={actionButtons} {...props} />;
}
