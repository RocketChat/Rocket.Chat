import React from 'react';
import { Button, FieldGroup, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import TriggersForm from './TriggersForm';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useForm } from '../../hooks/useForm';
import { useRoute } from '../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const NewTriggerPage = ({ onSave }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const router = useRoute('omnichannel-triggers');

	const save = useMethod('livechat:saveTrigger');

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
			name: 'send-message',
			params: {
				sender: 'queue',
				msg: '',
				name: '',
				department: '',
			},
		},
	});

	const handleSave = useMutableCallback(async () => {
		try {
			const { actions: { name: actionName, params: { sender, msg, name, department } }, ...restValues } = values;
			await save({
				...restValues,
				conditions: [values.conditions],
				actions: [{
					name: actionName,
					params: {
						sender,
						msg,
						department,
						...sender === 'custom' && { name },
					},
				}],
			});
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			onSave();
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return 	<>
		<FieldGroup>
			<TriggersForm values={values} handlers={handlers}/>
		</FieldGroup>
		<ButtonGroup align='end'>
			<Button primary onClick={handleSave}>
				{t('Save')}
			</Button>
		</ButtonGroup>
	</>;
};

export default NewTriggerPage;
