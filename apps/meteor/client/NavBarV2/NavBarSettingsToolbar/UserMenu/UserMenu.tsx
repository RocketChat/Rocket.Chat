import type { IUser } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useState } from 'react';

import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';
import { useHandleMenuAction } from '../../../components/GenericMenu/hooks/useHandleMenuAction';
import UserMenuButton from './UserMenuButton';
import { useUserMenu } from './hooks/useUserMenu';

type UserMenuProps = { user: IUser; className?: string };

const UserMenu = function UserMenu({ user }: UserMenuProps) {
	const t = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	const sections = useUserMenu(user);
	const items = sections.reduce((acc, { items }) => [...acc, ...items], [] as GenericMenuItemProps[]);

	const handleAction = useHandleMenuAction(items, () => setIsOpen(false));

	return (
		<GenericMenu
			is={UserMenuButton}
			placement='bottom-end'
			selectionMode='multiple'
			sections={sections}
			title={t('User_menu')}
			onAction={handleAction}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			aria-label={t('User_menu')}
		/>
	);
};

export default memo(UserMenu);
