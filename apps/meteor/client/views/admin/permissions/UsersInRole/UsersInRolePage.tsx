import { IRole } from '@rocket.chat/core-typings';
import { Box, Field, Margins, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useRef, ReactElement } from 'react';

import Page from '../../../../components/Page';
import RoomAutoComplete from '../../../../components/RoomAutoComplete';
import UserAutoComplete from '../../../../components/UserAutoComplete';
import UsersInRoleTable from './UsersInRoleTable';

const UsersInRolePage = ({ role }: { role: IRole }): ReactElement => {
	const t = useTranslation();
	const reload = useRef<() => void>(() => undefined);
	const [user, setUser] = useState<string | undefined>('');
	const [rid, setRid] = useState<string>();
	const [userError, setUserError] = useState<string>();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id, name, description } = role;
	const router = useRoute('admin-permissions');
	const addUser = useEndpoint('POST', 'roles.addUserToRole');

	const handleReturn = useMutableCallback(() => {
		router.push({
			context: 'edit',
			_id,
		});
	});

	const handleAdd = useMutableCallback(async () => {
		if (!user) {
			return setUserError(t('User_cant_be_empty'));
		}

		try {
			await addUser({ roleId: _id, username: user, roomId: rid });
			dispatchToastMessage({ type: 'success', message: t('User_added') });
			setUser(undefined);
			reload.current?.();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	});

	const handleUserChange = useMutableCallback((user) => {
		if (user !== '') {
			setUserError(undefined);
		}

		return setUser(user);
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
							<Field.Label>{t('Add_user')}</Field.Label>
							<Field.Row>
								<UserAutoComplete value={user} onChange={handleUserChange} placeholder={t('User')} />

								<ButtonGroup mis='x8' align='end'>
									<Button primary onClick={handleAdd}>
										{t('Add')}
									</Button>
								</ButtonGroup>
							</Field.Row>
							<Field.Error>{userError}</Field.Error>
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
