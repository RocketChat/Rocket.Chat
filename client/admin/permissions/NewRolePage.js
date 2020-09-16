import React from 'react';
import { Box, FieldGroup, ButtonGroup, Button, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import RoleForm from './RoleForm';
import { useForm } from '../../hooks/useForm';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';


const NewRolePage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers } = useForm({
		name: '',
		description: '',
		scope: 'Users',
		mandatory2fa: false,
	});

	const saveRole = useMethod('authorization:saveRole');

	const handleSave = useMutableCallback(async () => {
		try {
			await saveRole(values);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <Box w='full' alignSelf='center' mb='neg-x8'>
		<Margins block='x8'>
			<FieldGroup>
				<RoleForm values={values} handlers={handlers}/>
			</FieldGroup>
			<ButtonGroup stretch w='full'>
				<Button primary onClick={handleSave}>{t('Save')}</Button>
			</ButtonGroup>
		</Margins>
	</Box>;
};

export default NewRolePage;
