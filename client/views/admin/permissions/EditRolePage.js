import React from 'react';
import { Box, Field, FieldGroup, Button, Margins, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import RoleForm from './RoleForm';
import { useRoute } from '../../../contexts/RouterContext';
import { useForm } from '../../../hooks/useForm';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useRole } from './useRole';

const EditRolePageContainer = ({ _id }) => {
	const t = useTranslation();
	const role = useRole(_id);

	if (!role) {
		return <Callout type='danger'>{t('error-invalid-role')}</Callout>;
	}

	return <EditRolePage key={_id} data={role} />;
};

const EditRolePage = ({ data }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const usersInRoleRouter = useRoute('admin-permissions');
	const router = useRoute('admin-permissions');

	const { values, handlers, hasUnsavedChanges } = useForm({
		name: data.name,
		description: data.description || '',
		scope: data.scope || 'Users',
		mandatory2fa: !!data.mandatory2fa,
	});

	const saveRole = useMethod('authorization:saveRole');
	const deleteRole = useMethod('authorization:deleteRole');

	const handleManageUsers = useMutableCallback(() => {
		usersInRoleRouter.push({
			context: 'users-in-role',
			_id: data.name,
		});
	});

	const handleSave = useMutableCallback(async () => {
		try {
			await saveRole(values);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleDelete = useMutableCallback(async () => {
		try {
			await deleteRole(data.name);
			dispatchToastMessage({ type: 'success', message: t('Role_removed') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <Box w='full' alignSelf='center' mb='neg-x8'>
		<Margins block='x8'>
			<FieldGroup>
				<RoleForm values={values} handlers={handlers} editing isProtected={data.protected}/>
				<Field>
					<Field.Row>
						<Button primary w='full' disabled={!hasUnsavedChanges} onClick={handleSave}>{t('Save')}</Button>
					</Field.Row>
				</Field>
				{!data.protected && <Field>
					<Field.Row>
						<Button danger w='full' onClick={handleDelete}>{t('Delete')}</Button>
					</Field.Row>
				</Field>}
				<Field>
					<Field.Row>
						<Button w='full' onClick={handleManageUsers}>{t('Users_in_role')}</Button>
					</Field.Row>
				</Field>
			</FieldGroup>
		</Margins>
	</Box>;
};

export default EditRolePageContainer;
