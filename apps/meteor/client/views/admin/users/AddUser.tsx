import { useEndpoint, useRouter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React, { useCallback } from 'react';

import { useEndpointAction } from '../../../hooks/useEndpointAction';
import UserForm from './UserForm';

type AddUserProps = {
	onReload: () => void;
	availableRoles: any;
};

const AddUser = ({ onReload, availableRoles, ...props }: AddUserProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const eventStats = useEndpointAction('POST', '/v1/statistics.telemetry');
	const router = useRouter();
	const goToUser = useCallback(
		(id) =>
			router.navigate({
				pattern: '/admin/users/:context?/:id?',
				params: { context: 'info', id },
			}),
		[router],
	);
	const saveAction = useEndpoint('POST', '/v1/users.create');
	const handleSaveUser = useMutation({
		mutationFn: saveAction,
		onSuccess: async ({ user: { _id } }) => {
			dispatchToastMessage({ type: 'success', message: t('User_created_successfully!') });
			await eventStats({
				params: [{ eventName: 'updateCounter', settingsId: 'Manual_Entry_User_Count' }],
			});
			onReload();
			goToUser(_id);
		},
	});

	return <UserForm availableRoles={availableRoles} onSave={handleSaveUser} preserveData={false} hasAvatarObject={false} {...props} />;
};

export default AddUser;
