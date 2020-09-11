import React from 'react';
import { Box, FieldGroup, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/basic/Page';
import RoleForm from './RoleForm';
import { useRoute } from '../../contexts/RouterContext';
import { useForm } from '../../hooks/useForm';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';


const NewRolePage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRoute('admin-permissions');

	const { values, handlers } = useForm({
		name: '',
		description: '',
		scope: 'Users',
		mandatory2fa: false,
	});

	const saveRole = useMethod('authorization:saveRole');

	const handleReturn = useMutableCallback(() => {
		router.push({});
	});

	const handleSave = useMutableCallback(() => {
		try {
			const result = saveRole(values);
			console.log(result);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <Page>
		<Page.Header title={t('New_role')}>
			<ButtonGroup>
				<Button primary onClick={handleSave}>{t('Save')}</Button>
				<Button onClick={handleReturn}>{t('Back')}</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<FieldGroup>
					<RoleForm values={values} handlers={handlers}/>
				</FieldGroup>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default NewRolePage;
