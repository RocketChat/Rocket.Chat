import React from 'react';
import { Box, FieldGroup, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/basic/Page';
import RoleForm from './RoleForm';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useForm } from '../../hooks/useForm';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { Roles } from '../../../app/models/client';

const EditRolePageContainer = () => {
	const name = useRouteParameter('name');

	const role = useReactiveValue(useMutableCallback(() => Roles.find({ name }).fetch()[0]));

	if (!role) {
		return null;
	}

	return <EditRolePage data={role} />;
};

const EditRolePage = ({ data }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRoute('admin-permissions');

	const { values, handlers } = useForm({
		name: data.name,
		description: data.description || '',
		scope: data.scope || 'Users',
		mandatory2fa: !!data.mandatory2fa,
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
					<RoleForm values={values} handlers={handlers} disabledFields={true}/>
				</FieldGroup>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default EditRolePageContainer;
