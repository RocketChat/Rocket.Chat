import type { IUser, UserStatus as UserStatusEnum } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { callbacks } from '../../../../lib/callbacks';
import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';
import MarkdownText from '../../../components/MarkdownText';
import { UserStatus } from '../../../components/UserStatus';
import { userStatuses } from '../../../lib/userStatuses';
import type { UserStatusDescriptor } from '../../../lib/userStatuses';
import { useStatusDisabledModal } from '../../../views/admin/customUserStatus/hooks/useStatusDisabledModal';
import { useCustomStatusModalHandler } from './useCustomStatusModalHandler';

const isDefaultStatus = (id: string): boolean => userStatuses.isValidType(id);
const isDefaultStatusName = (_name: string, id: string): _name is UserStatusEnum => isDefaultStatus(id);
const translateStatusName = (t: ReturnType<typeof useTranslation>, status: UserStatusDescriptor): string => {
	if (isDefaultStatusName(status.name, status.id)) {
		return t(status.name as TranslationKey);
	}

	return status.name;
};

export const useStatusItems = (user: IUser): GenericMenuItemProps[] => {
	const t = useTranslation();
	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);
	const setStatus = useEndpoint('POST', '/v1/users.setStatus');

	const setStatusAction = (status: UserStatusDescriptor): void => {
		setStatus({ status: status.statusType, message: !isDefaultStatus(status.id) ? status.name : '' });
		void callbacks.run('userStatusManuallySet', status);
	};

	const filterInvisibleStatus = !useSetting('Accounts_AllowInvisibleStatusOption')
		? (status: UserStatusDescriptor): boolean => status.name !== 'invisible'
		: (): boolean => true;

	const handleCustomStatus = useCustomStatusModalHandler();

	const handleStatusDisabledModal = useStatusDisabledModal();

	const presenceDisabledItem = {
		id: 'presence-disabled',
		content: (
			<Box fontScale='p2'>
				<Box mbe={4} wordBreak='break-word' style={{ whiteSpace: 'normal' }}>
					{t('User_status_disabled')}
				</Box>
				<Box is='a' color='info' onClick={handleStatusDisabledModal}>
					{t('Learn_more')}
				</Box>
			</Box>
		),
	};

	const statusItems = Array.from(userStatuses)
		.filter(filterInvisibleStatus)
		.map((status) => {
			const name = status.localizeName ? translateStatusName(t, status) : status.name;
			const modifier = status.statusType || user?.status;
			return {
				id: status.id,
				status: <UserStatus status={modifier} />,
				content: <MarkdownText content={name} parseEmoji={true} variant='inline' />,
				onClick: () => setStatusAction(status),
				disabled: presenceDisabled,
			};
		});

	return [
		...(presenceDisabled ? [presenceDisabledItem] : []),
		...statusItems,
		{ id: 'custom-status', icon: 'emoji', content: t('Custom_Status'), onClick: handleCustomStatus, disabled: presenceDisabled },
	];
};
