import { Menu, Option } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import type { MonderationConsoleRowProps } from './ModerationConsoleTableRow';

const ModerationConsoleActions = ({ report, onClick, onChange, onReload }: MonderationConsoleRowProps): JSX.Element => {
	const { userId: uid } = report;
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const deleteMessages = useEndpoint('POST', '/v1/moderation.user.deleteMessageHistory');
	const markAsChecked = useEndpoint('POST', '/v1/moderation.markChecked');
	const deactiveUser = useEndpoint('POST', '/v1/users.setActiveStatus');
	const resetAvatar = useEndpoint('POST', '/v1/users.resetAvatar');

	const handleDeleteMessages = useMutation({
		mutationFn: deleteMessages,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: 'Messages deleted' });
		},
	});

	const confirmDeletMessages = (uid: string): void => {
		setModal(
			<GenericModal variant='danger' onConfirm={() => onDeleteAll(uid)} onCancel={() => setModal()}>
				This action will delete all messages from this user, and remove the report from this console. Are you sure you want to continue?
			</GenericModal>,
		);
	};

	const handleMarkAsChecked = useMutation({
		mutationFn: markAsChecked,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: 'Report marked as checked' });
		},
	});

	const confirmMarkAsChecked = (uid: string): void => {
		setModal(
			<GenericModal variant='danger' onConfirm={() => onApprove(uid)} onCancel={() => setModal()}>
				This action will mark this report as checked, and remove the report from this console. Are you sure you want to continue?
			</GenericModal>,
		);
	};

	const handleDeactiveUser = useMutation({
		mutationFn: deactiveUser,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: 'User deactivated' });
		},
	});

	const confirmDeactiveUser = (uid: string): void => {
		setModal(
			<GenericModal variant='danger' title='Deactivate User' onConfirm={() => onDeactiveUser(uid)} onCancel={() => setModal()}>
				This action will deactivate this user, and remove the report from this console. Are you sure you want to continue?
			</GenericModal>,
		);
	};

	const handleResetAvatar = useMutation({
		mutationFn: resetAvatar,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: 'Avatar reset' });
		},
	});

	const confirmResetAvatar = (uid: string): void => {
		setModal(
			<GenericModal variant='danger' onConfirm={() => onResetAvatar(uid)} onCancel={() => setModal()}>
				This action will reset this user's avatar, and remove the report from this console. Are you sure you want to continue?
			</GenericModal>,
		);
	};

	const onDeleteAll = (userId: string): void => {
		handleDeleteMessages.mutate({ userId });
		onReload();
		onChange();
		setModal();
	};

	const onDeactiveUser = (userId: string): void => {
		handleDeleteMessages.mutate({ userId });
		handleDeactiveUser.mutate({ userId, activeStatus: false });
		onReload();
		onChange();
		setModal();
	};

	const onResetAvatar = (userId: string): void => {
		handleResetAvatar.mutate({ userId });
		handleMarkAsChecked.mutate({ userId });
		onReload();
		onChange();
		setModal();
	};

	const onApprove = (userId: string): void => {
		handleMarkAsChecked.mutate({ userId });
		onReload();
		onChange();
		setModal();
	};

	return (
		<>
			<Menu
				options={{
					seeReports: {
						label: { label: 'View Messages', icon: 'document-eye' },
						action: () => onClick(uid),
					},
					divider: {
						type: 'divider',
					},
					approve: {
						label: { label: 'Approve', icon: 'check' },
						action: () => confirmMarkAsChecked(uid),
					},
					deleteAll: {
						label: { label: 'Delete All Messages', icon: 'trash' },
						action: () => confirmDeletMessages(uid),
					},
					deactiveUser: {
						label: { label: 'Deactivate User', icon: 'user' },
						action: () => confirmDeactiveUser(uid),
					},
					resetAvatar: {
						label: { label: 'Reset Avatar', icon: 'user' },
						action: () => confirmResetAvatar(uid),
					},
				}}
				renderItem={({ label: { label, icon }, ...props }): JSX.Element => <Option label={label} icon={icon} {...props} />}
			/>
		</>
	);
};

export default ModerationConsoleActions;
