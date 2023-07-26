import type { SelectOption } from '@rocket.chat/fuselage';
import { Button, ButtonGroup, ContextualbarFooter } from '@rocket.chat/fuselage';
import { useEndpoint, useRouter, useSetting, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery, useMutation } from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { parseCSV } from '../../../../lib/utils/parseCSV';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import UserForm from './UserForm';
import { useSmtpConfig } from './hooks/useSmtpConfig';

const AddUser = ({ onReload, ...props }: { onReload: () => void }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const defaultUserRoles = parseCSV(String(useSetting('Accounts_Registration_Users_Default_Roles')));
	const isSmtpEnabled = useSmtpConfig();

	const {
		control,
		watch,
		handleSubmit,
		register,
		reset,
		setValue,
		formState: { errors, isDirty },
	} = useForm({
		defaultValues: {
			name: '',
			username: '',
			email: '',
			verified: false,
			statusText: '',
			bio: '',
			nickname: '',
			password: '',
			setRandomPassword: false,
			requirePasswordChange: false,
			roles: defaultUserRoles,
			customFields: {},
			joinDefaultChannels: true,
			sendWelcomeEmail: Boolean(isSmtpEnabled),
		},
		mode: 'all',
	});

	console.log(errors);

	const getRoleData = useEndpoint('GET', '/v1/roles.list');

	const { data } = useQuery(['roles'], async () => {
		const roles = await getRoleData();
		return roles;
	});

	const availableRoles: SelectOption[] = useMemo(
		() => data?.roles?.map(({ _id, description, name }) => [_id, description || name]) ?? [],
		[data],
	);

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

	const append = (
		<ContextualbarFooter>
			<ButtonGroup stretch>
				<Button disabled={!isDirty} onClick={() => reset()}>
					{t('Cancel')}
				</Button>
				<Button
					primary
					disabled={!isDirty}
					onClick={handleSubmit(async (data) => {
						handleSaveUser.mutate(data);
					})}
				>
					{t('Save')}
				</Button>
			</ButtonGroup>
		</ContextualbarFooter>
	);

	return (
		<UserForm
			onReload={onReload}
			append={append}
			control={control}
			watch={watch}
			handleSubmit={handleSubmit}
			register={register}
			setValue={setValue}
			errors={errors}
			availableRoles={availableRoles}
			{...props}
		/>
	);
};

export default AddUser;
