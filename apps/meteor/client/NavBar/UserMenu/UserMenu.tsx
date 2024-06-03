import type { IUser } from '@rocket.chat/core-typings';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, memo } from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../components/GenericMenu/GenericMenuItem';
import { useHandleMenuAction } from '../../components/GenericMenu/hooks/useHandleMenuAction';
import UserAvatarStatus from './UserAvatarStatus';
import { useUserMenu } from './hooks/useUserMenu';

const anon = {
	_id: '',
	username: 'Anonymous',
	status: 'online',
	avatarETag: undefined,
} as const;

const UserMenu = ({ user, className }: { user: IUser; className?: string }) => {
	const t = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	const sections = useUserMenu(user);
	const items = sections.reduce((acc, { items }) => [...acc, ...items], [] as GenericMenuItemProps[]);

	const handleAction = useHandleMenuAction(items, () => setIsOpen(false));

	const { status = !user ? 'online' : 'offline', username, avatarETag } = user || anon;

	return (
		<>
			<GenericMenu
				icon={<UserAvatar size='x28' username={username || ''} etag={avatarETag} />}
				placement='bottom-end'
				selectionMode='multiple'
				sections={sections}
				title={t('User_menu')}
				onAction={handleAction}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				className={className}
				aria-label={t('User_menu')}
			/>
			<UserAvatarStatus status={status} />
		</>
	);
};

export default memo(UserMenu);
