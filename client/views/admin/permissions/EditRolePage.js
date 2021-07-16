import { Box, ButtonGroup, Button, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';
import { useSetModal } from '../../../contexts/ModalContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useForm } from '../../../hooks/useForm';
import RoleForm from './RoleForm';

const EditRolePage = ({ data }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const usersInRoleRouter = useRoute('admin-permissions');
	const router = useRoute('admin-permissions');

	const { values, handlers, hasUnsavedChanges } = useForm({
		roleId: data._id,
		name: data.name,
		description: data.description || '',
		scope: data.scope || 'Users',
		mandatory2fa: !!data.mandatory2fa,
	});

	const saveRole = useEndpoint('POST', 'roles.update');
	const deleteRole = useEndpoint('POST', 'roles.delete');

	const handleManageUsers = useMutableCallback(() => {
		usersInRoleRouter.push({
			context: 'users-in-role',
			_id: data._id,
		});
	});

	const handleSave = useMutableCallback(async () => {
		try {
			await saveRole(values);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleDelete = useMutableCallback(async () => {
		const deleteRoleAction = async () => {
			try {
				await deleteRole({ roleId: data._id });
				dispatchToastMessage({ type: 'success', message: t('Role_removed') });
				setModal();
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				setModal();
			}
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={deleteRoleAction}
				onClose={() => setModal()}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			>
				{t('Delete_Role_Warning')}
			</GenericModal>,
		);
	});

	return (
		<>
			<VerticalBar.ScrollableContent>
				<Box w='full' alignSelf='center' mb='neg-x8'>
					<Margins block='x8'>
						<RoleForm values={values} handlers={handlers} editing isProtected={data.protected} />
					</Margins>
				</Box>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup vertical stretch>
					<Button primary disabled={!hasUnsavedChanges} onClick={handleSave}>
						{t('Save')}
					</Button>
					{!data.protected && (
						<Button danger onClick={handleDelete}>
							{t('Delete')}
						</Button>
					)}
					<Button onClick={handleManageUsers}>{t('Users_in_role')}</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default EditRolePage;
