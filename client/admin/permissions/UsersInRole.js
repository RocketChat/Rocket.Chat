import React, { useState, useRef } from 'react';
import { Box, Field, Margins, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/basic/Page';
import UsersInRoleTable from './UsersInRoleTable';
import RoomAutoComplete from '../../components/basic/RoomAutoComplete';
import { UserAutoComplete } from '../../components/basic/AutoComplete';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useRole } from './useRole';

const UsersInRolePageContainer = () => {
	const _id = useRouteParameter('_id');

	const role = useRole(_id);

	if (!role) {
		return null;
	}

	return <UsersInRolePage data={role} />;
};

const UsersInRolePage = ({ data }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const reload = useRef();

	const [user, setUser] = useState();
	const [rid, setRid] = useState();

	const { name } = data;

	const router = useRoute('admin-permissions');

	const addUser = useMethod('authorization:addUserToRole');

	const handleReturn = useMutableCallback(() => {
		router.push({
			context: 'edit',
			_id: name,
		});
	});

	const handleAdd = useMutableCallback(async () => {
		try {
			await addUser(name, user, rid);
			dispatchToastMessage({ type: 'success', message: t('User_added') });
			setUser();
			reload.current();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <Page>
		<Page.Header title={`${ t('Users_in_role') } "${ name }"`}>
			<ButtonGroup>
				{/* <Button primary onClick={handleSave}>{t('Save')}</Button> */}
				<Button onClick={handleReturn}>{t('Back')}</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.Content>
			<Box display='flex' flexDirection='row' w='full' mi='neg-x4'>
				<Margins inline='x4'>
					{data.scope !== 'Users' && <Field>
						<Field.Label>{t('Choose_a_room')}</Field.Label>
						<Field.Row>
							<RoomAutoComplete value={rid} onChange={setRid} placeholder={t('User')}/>
						</Field.Row>
					</Field>}
					<Field>
						<Field.Label>{t('Add_user')}</Field.Label>
						<Field.Row>
							<UserAutoComplete value={user} onChange={setUser} placeholder={t('User')}/>
						</Field.Row>
					</Field>
					<Box display='flex' flexGrow={1} flexDirection='column' justifyContent='flex-end'>
						<Button primary onClick={handleAdd}>{t('Add')}</Button>
					</Box>
				</Margins>
			</Box>
			<Margins blockStart='x8'>
				{(data.scope === 'Users' || rid) && <UsersInRoleTable reloadRef={reload} scope={data.scope} rid={rid} roleName={data.name}/>}
				{data.scope !== 'Users' && !rid && <Callout type='info'>{t('Select_a_room')}</Callout>}
			</Margins>
		</Page.Content>
	</Page>;
};

export default UsersInRolePageContainer;
