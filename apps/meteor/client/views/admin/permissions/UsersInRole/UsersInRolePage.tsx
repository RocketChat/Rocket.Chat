import { IRole } from '@rocket.chat/core-typings';
import { Box, Field, Margins, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useRef, ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Page from '../../../../components/Page';
import RoomAutoComplete from '../../../../components/RoomAutoComplete';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import UsersInRoleTable from './UsersInRoleTable';

const UsersInRolePage = ({ role }: { role: IRole }): ReactElement => {
	const t = useTranslation();
	const reload = useRef<() => void>(() => undefined);

	const [rid, setRid] = useState<string>('');
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		control,
		handleSubmit,
		formState: { isDirty },
		reset,
	} = useForm<{ users: string[] }>({ defaultValues: { users: [] } });

	const isButtonEnabled = isDirty;

	const { _id, name, description } = role;
	const router = useRoute('admin-permissions');
	const addUser = useEndpoint('POST', '/v1/roles.addUserToRole');

	const handleReturn = useMutableCallback(() => {
		router.push({
			context: 'edit',
			_id,
		});
	});

	const handleAdd = useMutableCallback(async ({ users }: { users: string[] }) => {
		try {
			await Promise.all(
				users.map(async (u) => {
					await addUser({ roleName: _id, username: u, roomId: rid });
					dispatchToastMessage({ type: 'success', message: t('User_added') });
					reload.current();
					reset();
				}),
			);
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleChange = (value: unknown): void => {
		if (typeof value === 'string') {
			setRid(value);
		}
	};

	return (
		<Page>
			<Page.Header title={`${t('Users_in_role')} "${description || name}"`}>
				<ButtonGroup>
					<Button onClick={handleReturn}>{t('Back')}</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Box display='flex' flexDirection='column' w='full' mi='neg-x4'>
					<Margins inline='x4'>
						{role.scope !== 'Users' && (
							<Field mbe='x4'>
								<Field.Label>{t('Choose_a_room')}</Field.Label>
								<Field.Row>
									<RoomAutoComplete value={rid} onChange={handleChange} placeholder={t('User')} />
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
										<UserAutoCompleteMultiple
											value={value}
											placeholder={t('User')}
											onChange={(member, action): void => {
												if (!action && value) {
													if (value.includes(member)) {
														return;
													}
													return onChange([...value, member]);
												}

												onChange(value?.filter((current) => current !== member));
											}}
										/>
									)}
								/>

								<ButtonGroup mis='x8' align='end'>
									<Button primary onClick={handleSubmit(handleAdd)} disabled={!isButtonEnabled}>
										{t('Add')}
									</Button>
								</ButtonGroup>
							</Field.Row>
						</Field>
					</Margins>
				</Box>
				<Margins blockStart='x8'>
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
