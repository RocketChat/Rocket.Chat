import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Icon, Menu } from '@rocket.chat/fuselage';

import { Modal } from '../../components/basic/Modal';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useMethod } from '../../contexts/ServerContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useEndpointAction } from '../../hooks/useEndpointAction';


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

	const canDirectMessage = usePermission('create-d');
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

	const directMessageClick = () => directRoute.push({
		rid: username,
	});

	const editUserClick = () => userRoute.push({
		context: 'edit',
		id: _id,
	});

	const menuOptions = useMemo(() => ({
		...canDirectMessage && { directMessage: {
			label: <><Icon name='chat' size='x16' mie='x8'/>{t('Direct_Message')}</>,
			action: directMessageClick,
		} },
		...canEditOtherUserInfo && { editUser: {
			label: <><Icon name='edit' size='x16' mie='x8'/>{t('Edit')}</>,
			action: editUserClick,
		} },
		...canAssignAdminRole && { makeAdmin: {
			label: <><Icon mie='x4' name='key' size='x16'/>{ isAdmin ? t('Remove_Admin') : t('Make_Admin')}</>,
			action: changeAdminStatus,
		} },
		...canDeleteUser && { delete: {
			label: <Box color='danger'><Icon mie='x4' name='trash' size='x16'/>{t('Delete')}</Box>,
			action: confirmDeleteUser,
		} },
		...canEditOtherUserActiveStatus && { changeActiveStatus: {
			label: <><Icon mie='x4' name='user' size='x16'/>{ isActive ? t('Deactivate') : t('Activate')}</>,
			action: async () => {
				const result = await changeActiveStatus();
				result.success ? onChange() : undefined;
			},
		} },
	}), [canAssignAdminRole, canDeleteUser, canEditOtherUserActiveStatus, canEditOtherUserInfo, canDirectMessage, isActive, isAdmin]);

	const [actions, moreActions] = useMemo(() => {
		const keys = Object.keys(menuOptions);

		const firstHalf = keys.slice(0, 2);
		const secondHalf = keys.slice(2, keys.length);

		return [firstHalf.length && firstHalf.map((key) => menuOptions[key]), secondHalf.length && Object.fromEntries(secondHalf.map((key) => [key, menuOptions[key]]))];
	}, menuOptions);

	return <>
		<Box display='flex' flexDirection='row' {...props}>
			<ButtonGroup flexGrow={1} justifyContent='center'>
				{ actions && actions.map((action, index) => (<Button key={index} onClick={action.action}>{action.label}</Button>))}
				{ moreActions && <Menu options={moreActions} placement='bottom left'/> }
			</ButtonGroup>
		</Box>
		{ modal }
	</>;
};
