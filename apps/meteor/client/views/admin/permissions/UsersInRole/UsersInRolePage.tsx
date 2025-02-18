import type { IRole, IRoom } from '@rocket.chat/core-typings';
import { Box, Field, FieldLabel, FieldRow, Margins, ButtonGroup, Button, Callout, FieldError } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, type ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';

import UsersInRoleTable from './UsersInRoleTable';
import { Page, PageHeader, PageContent } from '../../../../components/Page';
import RoomAutoComplete from '../../../../components/RoomAutoComplete';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';

type UsersInRolePayload = {
	rid?: IRoom['_id'];
	users: string[];
};

const UsersInRolePage = ({ role }: { role: IRole }): ReactElement => {
	const t = useTranslation();
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

	const handleAdd = useEffectEvent(async ({ users, rid }: UsersInRolePayload) => {
		try {
			await Promise.all(
				users.map(async (user) => {
					if (user) {
						await addUserToRoleEndpoint({ roleName: _id, username: user, roomId: rid });
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

	return (
		<Page>
			<PageHeader title={`${t('Users_in_role')} "${description || name}"`}>
				<ButtonGroup>
					<Button onClick={() => router.navigate(`/admin/permissions/edit/${_id}`)}>{t('Back')}</Button>
				</ButtonGroup>
			</PageHeader>
			<PageContent>
				<Box display='flex' flexDirection='column' w='full' mi='neg-x4'>
					<Margins inline={4}>
						{role.scope !== 'Users' && (
							<Field mbe={4}>
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
								<Button mis={8} primary onClick={handleSubmit(handleAdd)} disabled={!isDirty}>
									{t('Add')}
								</Button>
							</FieldRow>
							{errors.users && (
								<FieldRow>
									<FieldError aria-live='assertive' id={`${usersFieldId}-error`}>
										{errors.users.message}
									</FieldError>
								</FieldRow>
							)}
						</Field>
					</Margins>
				</Box>
				<Margins blockStart={8}>
					{(role.scope === 'Users' || rid) && <UsersInRoleTable rid={rid} roleId={_id} roleName={name} description={description} />}
					{role.scope !== 'Users' && !rid && <Callout type='info'>{t('Select_a_room')}</Callout>}
				</Margins>
			</PageContent>
		</Page>
	);
};

export default UsersInRolePage;
