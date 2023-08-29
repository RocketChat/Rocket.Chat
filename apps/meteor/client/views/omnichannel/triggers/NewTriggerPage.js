import { Button, FieldGroup, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../components/Contextualbar';
import { useForm } from '../../../hooks/useForm';
import TriggersForm from './TriggersForm';

const NewTriggerPage = ({ onSave }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const router = useRoute('omnichannel-triggers');

	const save = useEndpoint('POST', '/v1/livechat/triggers');

	const { values, handlers } = useForm({
		name: '',
		description: '',
		enabled: true,
		runOnce: false,
		conditions: {
			name: 'page-url',
			value: '',
		},
		actions: {
			name: '',
			params: {
				sender: 'queue',
				msg: '',
				name: '',
			},
		},
	});

	const handleSave = useMutableCallback(async () => {
		try {
			const {
				actions: {
					params: { sender, msg, name },
				},
				...restValues
			} = values;
			await save({
				...restValues,
				conditions: [values.conditions],
				actions: [
					{
						name: 'send-message',
						params: {
							sender,
							msg,
							...(sender === 'custom' && { name }),
						},
					},
				],
			});
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			onSave();
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const {
		name,
		actions: {
			params: { msg },
		},
	} = values;

	const canSave = useMemo(() => name && msg, [name, msg]);

	return (
		<>
			<ContextualbarScrollableContent>
				<FieldGroup>
					<TriggersForm values={values} handlers={handlers} />
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button primary onClick={handleSave} disabled={!canSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default NewTriggerPage;
