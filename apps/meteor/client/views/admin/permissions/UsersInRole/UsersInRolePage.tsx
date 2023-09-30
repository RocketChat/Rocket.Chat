import type { IRole, IRoom } from '@rocket.chat/core-typings';
import { Box, Field, Margins, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Page from '../../../../components/Page';
import RoomAutoComplete from '../../../../components/RoomAutoComplete';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import UsersInRoleTable from './UsersInRoleTable';

type UsersInRolePayload = {
	rid?: IRoom['_id'];
	users: string[];
};

const UsersInRolePage = ({ role }: { role: IRole }): ReactElement => {
	const t = useTranslation();
	const reload = useRef<() => void>(() => undefined);
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		control,
		handleSubmit,
		formState: { isDirty },
		reset,
		getValues,
	} = useForm<UsersInRolePayload>({ defaultValues: { users: [] } });

	const { _id, name, description } = role;
	const router = useRoute('admin-permissions');
	const addUser = useEndpoint('POST', '/v1/roles.addUserToRole');

	const rid = getValues('rid');

	const handleReturn = useMutableCallback(() => {
		router.push({
			context: 'edit',
			_id,
		});
	});

	const handleAdd = useMutableCallback(async ({ users, rid }: UsersInRolePayload) => {
		try {
			await Promise.all(
				users.map(async (user) => {
					if (user) {
						await addUser({ roleName: _id, username: user, roomId: rid });
					}
				}),
			);
			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			reload.current();
			reset();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return (
		<Page>
			<Page.Header title={`${t('Users_in_role')} "${description || name}"`}>
				<ButtonGroup>
					<Button onClick={handleReturn}>{t('Back')}</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Box display='flex' flexDirection='column' w='full' mi='neg-x4'>
					<Margins inline={4}>
						{role.scope !== 'Users' && (
							<Field mbe={4}>
								<Field.Label>{t('Choose_a_room')}</Field.Label>
								<Field.Row>
									<Controller
										control={control}
										name='rid'
										render={({ field: { onChange, value } }): ReactElement => (
											<RoomAutoComplete value={value} onChange={onChange} placeholder={t('User')} />
										)}
									/>
								</Field.Row>
							</Field>
						)}
						<Field>
							<Field.Label>{t('Add_users')}</Field.Label>
							<Field.Row>
								<Controller
									control={control}
									name='users'
									render={({ field: { onChange, value } }): ReactElement => (
										<UserAutoCompleteMultiple value={value} placeholder={t('User')} onChange={onChange} />
									)}
								/>
								<ButtonGroup mis={8} align='end'>
									<Button primary onClick={handleSubmit(handleAdd)} disabled={!isDirty}>
										{t('Add')}
									</Button>
								</ButtonGroup>
							</Field.Row>
						</Field>
					</Margins>
				</Box>
				<Margins blockStart={8}>
					{(role.scope === 'Users' || rid) && (
						<UsersInRoleTable reloadRef={reload} rid={rid} roleId={_id} roleName={name} description={description} />
					)}
					{role.scope !== 'Users' && !rid && <Callout type='info'>{t('Select_a_room')}</Callout>}
				</Margins>
			</Page.Content>
		</Page>
	);
};

export default UsersInRolePage;
