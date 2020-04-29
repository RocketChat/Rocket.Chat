import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Icon, Menu } from '@rocket.chat/fuselage';

import { Modal } from '../../components/basic/Modal';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useEndpointAction } from '../usersAndRooms/hooks';
import { useMethod } from '../../contexts/ServerContext';
import { useSetting } from '../../contexts/SettingsContext';


const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	const erasureType = useSetting('Message_ErasureType');

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t(`Delete_User_Warning_${ erasureType }`)}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('User_has_been_deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};


export const UserInfoActions = ({ username, _id, isActive, isAdmin, onChange, ...props }) => {
	const t = useTranslation();
	const [modal, setModal] = useState();

	const directRoute = useRoute('direct');
	const userRoute = useRoute('admin-users');
	const dispatchToastMessage = useToastMessageDispatch();

	const canEditOtherUserInfo = usePermission('edit-other-user-info');
	const canAssignAdminRole = usePermission('assign-admin-role');
	const canEditOtherUserActiveStatus = usePermission('edit-other-user-active-status');
	const canDeleteUser = usePermission('delete-user');

	const deleteUserQuery = useMemo(() => ({ userId: _id }), [_id]);
	const deleteUser = useEndpointAction('POST', 'users.delete', deleteUserQuery);

	const willDeleteUser = useCallback(async () => {
		const result = await deleteUser();
		if (result.success) {
			setModal(<SuccessModal onClose={() => { setModal(); onChange(); }}/>);
		} else {
			setModal();
		}
	}, [deleteUser]);
	const confirmDeleteUser = useCallback(() => {
		setModal(<DeleteWarningModal onDelete={willDeleteUser} onCancel={() => setModal()}/>);
	}, [deleteUser]);

	const setAdminStatus = useMethod('setAdminStatus');
	const changeAdminStatus = useCallback(() => {
		try {
			setAdminStatus(_id, !isAdmin);
			const message = isAdmin ? 'User_is_no_longer_an_admin' : 'User_is_now_an_admin';
			dispatchToastMessage({ type: 'success', message: t(message) });
			onChange();
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


	const menuOptions = useMemo(() => ({
		...canAssignAdminRole && { makeAdmin: {
			label: <Box display='flex' alignItems='center'><Icon mie='x4' name='key' size='x16'/>{ isAdmin ? t('Remove_Admin') : t('Make_admin')}</Box>,
			action: changeAdminStatus,
		} },
		...canDeleteUser && { delete: {
			label: <Box display='flex' alignItems='center' color='danger'><Icon mie='x4' name='trash' size='x16'/>{t('Delete')}</Box>,
			action: confirmDeleteUser,
		} },
		...canEditOtherUserActiveStatus && { changeActiveStatus: {
			label: <Box display='flex' alignItems='center'><Icon mie='x4' name='user' size='x16'/>{ isActive ? t('Activate') : t('Deactivate')}</Box>,
			action: async () => {
				const result = await changeActiveStatus();
				result.success ? onchange() : undefined;
			},
		} },
	}), [canAssignAdminRole, canDeleteUser, canEditOtherUserActiveStatus]);


	const directMessageClick = () => directRoute.push({
		rid: username,
	});

	const editUserClick = () => userRoute.push({
		context: 'edit',
		id: _id,
	});

	return <>
		<Box display='flex' flexDirection='row' {...props}>
			<ButtonGroup flexGrow={1} justifyContent='center'>
				<Button onClick={directMessageClick}><Icon name='chat' size='x16' mie='x8'/>{t('Direct_Message')}</Button>
				{ canEditOtherUserInfo && <Button onClick={editUserClick}><Icon name='edit' size='x16' mie='x8'/>{t('Edit')}</Button> }
				{ [canAssignAdminRole, canDeleteUser, canEditOtherUserActiveStatus].filter(Boolean).length && <Menu options={menuOptions} /> }
			</ButtonGroup>
		</Box>
		{ modal }
	</>;
};
