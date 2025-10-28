import type { IRole, IRoom, IUserInRole } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useRemoveUserFromRole = ({
	rid,
	roleId,
	roleName,
	roleDescription,
}: {
	rid?: IRoom['_id'];
	roleId: IRole['_id'];
	roleName: IRole['name'];
	roleDescription: IRole['description'];
}) => {
	const { t } = useTranslation();

	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const removeUserFromRoleEndpoint = useEndpoint('POST', '/v1/roles.removeUserFromRole');

	const handleRemove = useEffectEvent((username: IUserInRole['username']) => {
		const remove = async () => {
			try {
				if (!username) throw new Error('Username is required');

				await removeUserFromRoleEndpoint({ roleId, username, scope: rid });
				dispatchToastMessage({ type: 'success', message: t('User_removed') });
				queryClient.invalidateQueries({
					queryKey: ['getUsersInRole'],
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal variant='danger' onConfirm={remove} onCancel={() => setModal(null)} confirmText={t('Delete')}>
				{t('The_user_s_will_be_removed_from_role_s', { postProcess: 'sprintf', sprintf: [username, roleDescription || roleName] })}
			</GenericModal>,
		);
	});

	return handleRemove;
};
