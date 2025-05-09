import type { IRole } from '@rocket.chat/core-typings';
import { Box, ButtonGroup, Button, Margins } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import RoleForm from './RoleForm';
import { ContextualbarFooter, ContextualbarScrollableContent } from '../../../components/Contextualbar';
import GenericModal from '../../../components/GenericModal';

export type EditRolePageFormData = {
	roleId: string;
	name: string;
	description: string;
	scope: 'Users' | 'Subscriptions';
	mandatory2fa: boolean;
};

const EditRolePage = ({ role, isEnterprise }: { role?: IRole; isEnterprise: boolean }): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const usersInRoleRouter = useRoute('admin-permissions');
	const router = useRoute('admin-permissions');

	const createRole = useEndpoint('POST', '/v1/roles.create');
	const updateRole = useEndpoint('POST', '/v1/roles.update');
	const deleteRole = useEndpoint('POST', '/v1/roles.delete');

	const methods = useForm<EditRolePageFormData>({
		defaultValues: {
			roleId: role?._id,
			name: role?.name,
			description: role?.description,
			scope: role?.scope || 'Users',
			mandatory2fa: !!role?.mandatory2fa,
		},
	});

	const handleManageUsers = useEffectEvent(() => {
		if (role?._id) {
			usersInRoleRouter.push({
				context: 'users-in-role',
				_id: role._id,
			});
		}
	});

	const handleSave = useEffectEvent(async (data: EditRolePageFormData) => {
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

	const handleDelete = useEffectEvent(async () => {
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

		const deleteRoleMessage = isEnterprise ? t('Delete_Role_Warning') : t('Delete_Role_Warning_Not_Enterprise');

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={deleteRoleAction}
				onClose={(): void => setModal()}
				onCancel={(): void => setModal()}
				confirmText={t('Delete')}
			>
				{deleteRoleMessage}
			</GenericModal>,
		);
	});

	return (
		<>
			<ContextualbarScrollableContent>
				<Box w='full' alignSelf='center' mb='neg-x8'>
					<Margins block={8}>
						<FormProvider {...methods}>
							<RoleForm editing={Boolean(role?._id)} isProtected={role?.protected} isDisabled={!isEnterprise} />
						</FormProvider>
					</Margins>
				</Box>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup vertical stretch>
					<Button primary disabled={!methods.formState.isDirty || !isEnterprise} onClick={methods.handleSubmit(handleSave)}>
						{t('Save')}
					</Button>
					{!role?.protected && role?._id && (
						<Button secondary danger onClick={handleDelete}>
							{t('Delete')}
						</Button>
					)}
					{role?._id && <Button onClick={handleManageUsers}>{t('Users_in_role')}</Button>}
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default EditRolePage;
