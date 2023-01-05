import type { IRole } from '@rocket.chat/core-typings';
import { Box, ButtonGroup, Button, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';
import RoleForm from './RoleForm';

const EditRolePage = ({ role }: { role?: IRole }): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const usersInRoleRouter = useRoute('admin-permissions');
	const router = useRoute('admin-permissions');

	const createRole = useEndpoint('POST', '/v1/roles.create');
	const updateRole = useEndpoint('POST', '/v1/roles.update');
	const deleteRole = useEndpoint('POST', '/v1/roles.delete');

	const methods = useForm({
		defaultValues: {
			roleId: role?._id,
			name: role?.name,
			description: role?.description,
			scope: role?.scope || 'Users',
			mandatory2fa: !!role?.mandatory2fa,
		},
	});

	const handleManageUsers = useMutableCallback(() => {
		if (role?._id) {
			usersInRoleRouter.push({
				context: 'users-in-role',
				_id: role._id,
			});
		}
	});

	const handleSave = useMutableCallback(async (data) => {
		try {
			if (data.roleId) {
				await updateRole(data);
				dispatchToastMessage({ type: 'success', message: t('Saved') });
				return router.push({});
			}

			await createRole(data);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleDelete = useMutableCallback(async () => {
		if (!role?._id) {
			return;
		}

		const deleteRoleAction = async (): Promise<void> => {
			try {
				await deleteRole({ roleId: role._id });
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
				onClose={(): void => setModal()}
				onCancel={(): void => setModal()}
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
						<FormProvider {...methods}>
							<RoleForm editing={Boolean(role?._id)} isProtected={role?.protected} />
						</FormProvider>
					</Margins>
				</Box>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup vertical stretch>
					<Button primary disabled={!methods.formState.isDirty} onClick={methods.handleSubmit(handleSave)}>
						{t('Save')}
					</Button>
					{!role?.protected && role?._id && (
						<Button secondary danger onClick={handleDelete}>
							{t('Delete')}
						</Button>
					)}
					{role?._id && <Button onClick={handleManageUsers}>{t('Users_in_role')}</Button>}
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default EditRolePage;
