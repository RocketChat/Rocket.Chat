import { useEndpoint, useRouter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';

import { useEndpointAction } from '../../../hooks/useEndpointAction';
import UserForm from './UserForm';

type AddUserProps = {
	onReload: () => void;
	availableRoles: any;
	userData: UseQueryResult<any, unknown>;
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

	// const append = (
	// 	<ContextualbarFooter>
	// 		<ButtonGroup stretch>
	// 			<Button disabled={!isDirty} onClick={() => reset()}>
	// 				{t('Cancel')}
	// 			</Button>
	// 			<Button
	// 				primary
	// 				disabled={!isDirty}
	// 				onClick={handleSubmit(async (data) => {
	// 					handleSaveUser.mutate(data);
	// 				})}
	// 			>
	// 				{t('Save')}
	// 			</Button>
	// 		</ButtonGroup>
	// 	</ContextualbarFooter>
	// );

	return (
		<UserForm
			onReload={onReload}
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
