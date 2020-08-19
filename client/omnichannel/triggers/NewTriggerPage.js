import React from 'react';
import { Button, FieldGroup, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import TriggersForm from './TriggersForm';
import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useForm } from '../../hooks/useForm';
import { useRoute } from '../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const NewTriggerPage = () => {
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
			const { actions: { sender, msg, name }, ...restValues } = values;
			await save({
				...restValues,
				conditions: [values.conditions],
				actions: [{
					name: 'send-message',
					params: {
						sender,
						msg,
						...sender === 'custom' && { name },
					},
				}],
			});
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <Page>
		<Page.Header title={t('Trigger')} >
			<Button small onClick={handleSave}>
				{t('Save')}
			</Button>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' alignSelf='center' w='full'>
				<FieldGroup>
					<TriggersForm values={values} handlers={handlers}/>
				</FieldGroup>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default NewTriggerPage;
