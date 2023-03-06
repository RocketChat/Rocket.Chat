import { Menu, Option } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import type { MonderationConsoleRowProps } from './ModerationConsoleTableRow';

const ModerationConsoleActions = ({ report, onClick }: MonderationConsoleRowProps): JSX.Element => {
	const { userId } = report;

	const deleteMessages = useEndpoint('POST', '/v1/moderation.user.deleteMessageHistory');
	const markAsChecked = useEndpoint('POST', '/v1/moderation.markChecked');
	const deactiveUser = useEndpoint('POST', '/v1/users.setActiveStatus');
	const resetAvatar = useEndpoint('POST', '/v1/users.resetAvatar');

	const handleDeleteMessages = useMutation({
		mutationFn: deleteMessages,
	});

	const handleMarkAsChecked = useMutation({
		mutationFn: markAsChecked,
	});

	const handleDeactiveUser = useMutation({
		mutationFn: deactiveUser,
	});

	const handleResetAvatar = useMutation({
		mutationFn: resetAvatar,
	});

	const onDeleteAll = async (): Promise<void> => {
		await handleDeleteMessages.mutateAsync({ userId });
	};

	const onDeactiveUser = async (): Promise<void> => {
		await handleDeleteMessages.mutateAsync({ userId });
		await handleDeactiveUser.mutateAsync({ userId, activeStatus: false });
	};

	const onResetAvatar = async (): Promise<void> => {
		await handleResetAvatar.mutateAsync({ userId });
		await handleMarkAsChecked.mutateAsync({ userId });

		// onClick(_id);
	};

	const onApprove = async (): Promise<void> => {
		try {
			await handleMarkAsChecked.mutateAsync({ userId });
		} catch (error) {
			throw new Error(error);
		}

		// onClick(_id);
	};

	return (
		<>
			<Menu
				options={{
					seeReports: {
						label: { label: 'See Reports', icon: 'eye' },
						action: () => onClick(_id),
					},
					divider: {
						type: 'divider',
					},
					approve: {
						label: { label: 'Approve', icon: 'check' },
						action: () => onApprove(),
					},
					deleteAll: {
						label: { label: 'Delete All Messages', icon: 'trash' },
						action: () => onDeleteAll(),
					},
					deactiveUser: {
						label: { label: 'Deactivate User', icon: 'user' },
						action: () => onClick(_id),
					},
					resetAvatar: {
						label: { label: 'Reset Avatar', icon: 'user' },
						action: () => onClick(_id),
					},
				}}
				renderItem={({ label: { label, icon }, ...props }): JSX.Element => <Option label={label} icon={icon} {...props} />}
			/>
		</>
	);
};

export default ModerationConsoleActions;
