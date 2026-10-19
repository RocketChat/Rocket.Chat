import type { IRole, IRoom } from '@rocket.chat/core-typings';
import { Box, Field, FieldLabel, FieldRow, ButtonGroup, Button, Callout, FieldError, Stack } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { getCombineFn, usePaginatedQuery, usePagination, Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UsersInRoleTable from './UsersInRoleTable';
import { useRemoveUserFromRole } from './hooks/useRemoveUserFromRole';
import RoomAutoComplete from '../../../../components/RoomAutoComplete';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';

type UsersInRolePayload = {
	rid?: IRoom['_id'];
	users: string[];
};

export type UsersInRolePageProps = { role: IRole };

const UsersInRolePage = ({ role }: UsersInRolePageProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty },
		watch,
	} = useForm<UsersInRolePayload>({ defaultValues: { users: [] } });

	const { _id, name, description } = role;
	const router = useRouter();
	const addUserToRoleEndpoint = useEndpoint('POST', '/v1/roles.addUserToRole');

	const { rid } = watch();
	const roomFieldId = useId();
	const usersFieldId = useId();

	const handleAdd = useStableCallback(async ({ users, rid }: UsersInRolePayload) => {
		try {
			await Promise.all(
				users.map(async (user) => {
					if (user) {
						await addUserToRoleEndpoint({ roleId: _id, username: user, roomId: rid });
					}
				}),
			);
			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			queryClient.invalidateQueries({
				queryKey: ['getUsersInRole'],
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const getUsersInRoleEndpoint = useEndpoint('GET', '/v1/roles.getUsersInRole');

	const query = useMemo(
		() => ({
			role: _id,
			...(rid && { roomId: rid }),
		}),
		[rid, _id],
	);

	const queryKey = ['getUsersInRole', _id, query];
	const paginationData = usePagination({ resetKey: queryKey });
	const { itemsPerPage, current } = paginationData;

	const { data, isLoading, isSuccess, refetch, isError } = usePaginatedQuery({
		query,
		queryKey,
		queryFn: async (params) => {
			const result = await getUsersInRoleEndpoint(params);
			return { ...result, count: result.users.length };
		},
		combineData: getCombineFn('users'),
		offset: current,
		count: itemsPerPage,
	});

	const handleRemove = useRemoveUserFromRole({ rid, roleId: _id, roleName: name, roleDescription: description });

	return (
		<Page>
			<PageHeader title={`${t('Users_in_role')} "${description || name}"`}>
				<ButtonGroup>
					<Button onClick={() => router.navigate(`/admin/permissions/edit/${_id}`)}>{t('Back')}</Button>
				</ButtonGroup>
			</PageHeader>
			<PageContent gap={8}>
				<Box display='flex' flexDirection='column' width='full' gap={4}>
					{role.scope !== 'Users' && (
						<Field>
							<FieldLabel htmlFor={roomFieldId}>{t('Choose_a_room')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='rid'
									rules={{ required: t('Required_field', { field: t('Room') }) }}
									render={({ field: { onChange, value } }) => (
										<RoomAutoComplete
											id={roomFieldId}
											aria-required='true'
											aria-invalid={Boolean(errors.rid)}
											aria-describedby={`${roomFieldId}-error`}
											scope='admin'
											value={value}
											onChange={onChange}
											placeholder={t('Room')}
										/>
									)}
								/>
							</FieldRow>
							{errors.rid && (
								<FieldError aria-live='assertive' id={`${roomFieldId}-error`}>
									{errors.rid.message}
								</FieldError>
							)}
						</Field>
					)}
					<Field>
						<FieldLabel htmlFor={usersFieldId}>{t('Add_users')}</FieldLabel>
						<FieldRow>
							<Stack direction='row' align='center' justify='space-between' grow gap={8}>
								<Controller
									control={control}
									name='users'
									rules={{ required: t('Required_field', { field: t('Users') }) }}
									render={({ field: { onChange, value } }) => (
										<UserAutoCompleteMultiple
											id={usersFieldId}
											aria-required='true'
											aria-invalid={Boolean(errors.users)}
											aria-describedby={`${usersFieldId}-error`}
											value={value}
											placeholder={t('Users')}
											onChange={onChange}
										/>
									)}
								/>
								<Button variant='primary' onClick={handleSubmit(handleAdd)} disabled={!isDirty}>
									{t('Add')}
								</Button>
							</Stack>
						</FieldRow>
						{errors.users && (
							<FieldRow>
								<FieldError aria-live='assertive' id={`${usersFieldId}-error`}>
									{errors.users.message}
								</FieldError>
							</FieldRow>
						)}
					</Field>
				</Box>
				{(role.scope === 'Users' || rid) && (
					<UsersInRoleTable
						isLoading={isLoading}
						isError={isError}
						isSuccess={isSuccess}
						total={data?.total || 0}
						users={data?.users || []}
						onRemove={handleRemove}
						refetch={refetch}
						paginationData={paginationData}
					/>
				)}
				{role.scope !== 'Users' && !rid && <Callout type='info'>{t('Select_a_room')}</Callout>}
			</PageContent>
		</Page>
	);
};

export default UsersInRolePage;
