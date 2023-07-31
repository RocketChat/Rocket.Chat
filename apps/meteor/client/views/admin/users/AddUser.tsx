import type { IUser } from '@rocket.chat/core-typings';
import { useEndpoint, useRouter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';

import { useEndpointAction } from '../../../hooks/useEndpointAction';
import UserForm from './UserForm';

type AddUserProps = {
	onReload: () => void;
	availableRoles: any;
	userData: IUser | Record<string, never>;
};

const AddUser = ({ onReload, availableRoles, userData, ...props }: AddUserProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
		onSuccess: ({ user: { _id } }) => {
			dispatchToastMessage({ type: 'success', message: t('User_created_successfully!') });
			eventStats({
				params: [{ eventName: 'updateCounter', settingsId: 'Manual_Entry_User_Count' }],
			});
			goToUser(_id);
			onReload();
		},
	});

	return (
		<UserForm
			availableRoles={availableRoles}
			setHasUnsavedChanges={setHasUnsavedChanges}
			canSaveOrReset={hasUnsavedChanges}
			onSave={handleSaveUser}
			preserveData={false}
			userData={userData}
			{...props}
		/>
	);
};

export default AddUser;
