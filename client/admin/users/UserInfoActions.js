import React, { useCallback, useMemo } from 'react';
import { Box, Button, ButtonGroup, Icon, Menu } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useEndpointAction } from '../usersAndRooms/hooks';
import { useMethod } from '../../contexts/ServerContext';


export const UserInfoActions = ({ username, _id, isActive, isAdmin, ...props }) => {
	const t = useTranslation();
	const directRoute = useRoute('direct');
	const userRoute = useRoute('admin-users');
	const dispatchToastMessage = useToastMessageDispatch();

	const canEditOtherUserInfo = usePermission('edit-other-user-info');
	const canAssignAdminRole = usePermission('assign-admin-role');
	const canEditOtherUserActiveStatus = usePermission('edit-other-user-active-status');
	const canDeleteUser = usePermission('delete-user');

	const deleteUserQuery = useMemo(() => ({ userId: _id }), [_id]);
	const deleteUser = useEndpointAction('POST', 'users.delete', deleteUserQuery, t('User_has_been_deleted'));

	const setAdminStatus = useMethod('setAdminStatus');
	const changeAdminStatus = useCallback(() => {
		try {
			setAdminStatus(_id, !isAdmin);
			const message = isAdmin ? 'User_is_no_longer_an_admin' : 'User_is_now_an_admin';
			dispatchToastMessage({ type: 'success', message: t(message) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [isAdmin]);

	const activeStatusQuery = useMemo(() => ({
		userId: _id,
		activeStatus: !isActive,
	}), [_id, isActive]);
	const changeActiveStatusMessage = isActive ? 'User_has_been_deactivated' : 'User_has_been_activated';
	const changeActiveStatus = useEndpointAction('POST', 'users.setActiveStatus', activeStatusQuery, t(changeActiveStatusMessage));


	const menuOptions = {
		makeAdmin: canAssignAdminRole && {
			label: <Box display='flex' alignItems='center'><Icon mie='x4' name='key' size='x16'/>{ isAdmin ? t('Remove_Admin') : t('Make_admin')}</Box>,
			action: changeAdminStatus,
		},
		delete: canDeleteUser && {
			label: <Box display='flex' alignItems='center' textColor='danger'><Icon mie='x4' name='trash' size='x16'/>{t('Delete')}</Box>,
			action: deleteUser,
		},
		changeActiveStatus: canEditOtherUserActiveStatus && {
			label: <Box display='flex' alignItems='center'><Icon mie='x4' name='twitter' size='x16'/>{ isActive ? t('User_has_been_activated') : t('User_has_been_deactivated')}</Box>,
			action: changeActiveStatus,
		},
	};


	const directMessageClick = () => directRoute.push({
		rid: username,
	});

	const editUserClick = () => userRoute.push({
		context: 'edit',
		id: _id,
	});

	return <Box display='flex' flexDirection='row' {...props}>
		<ButtonGroup flexGrow={1} justifyContent='center'>
			<Button onClick={directMessageClick}><Icon name='chat' size='x16' mie='x8'/>{t('Direct_Message')}</Button>
			{ canEditOtherUserInfo && <Button onClick={editUserClick}><Icon name='edit' size='x16' mie='x8'/>{t('Edit')}</Button> }
			<Menu options={menuOptions}/>
		</ButtonGroup>
	</Box>;
};
