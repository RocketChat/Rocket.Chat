import type { IUser } from '@rocket.chat/core-typings';
import {
	FeaturePreview,
	FeaturePreviewOn,
	FeaturePreviewOff,
	GenericMenu,
	useHandleMenuAction,
	type GenericMenuItemProps,
} from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, memo } from 'react';

import UserAvatarWithStatus from './UserAvatarWithStatus';
import UserAvatarWithStatusUnstable from './UserAvatarWithStatusUnstable';
import { useUserMenu } from './hooks/useUserMenu';

const UserMenu = ({ user }: { user: IUser }) => {
	const t = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	const sections = useUserMenu(user);
	const items = sections.reduce((acc, { items }) => [...acc, ...items], [] as GenericMenuItemProps[]);

	const handleAction = useHandleMenuAction(items, () => setIsOpen(false));

	return (
		<FeaturePreview feature='navigationBar'>
			<FeaturePreviewOff>
				<GenericMenu
					icon={<UserAvatarWithStatus />}
					placement='bottom-end'
					selectionMode='multiple'
					sections={sections}
					title={t('User_menu')}
					aria-label={t('User_menu')}
					onAction={handleAction}
					isOpen={isOpen}
					onOpenChange={setIsOpen}
				/>
			</FeaturePreviewOff>
			<FeaturePreviewOn>
				<GenericMenu
					icon={<UserAvatarWithStatusUnstable />}
					medium
					placement='bottom-end'
					selectionMode='multiple'
					sections={sections}
					title={t('User_menu')}
					aria-label={t('User_menu')}
					onAction={handleAction}
					isOpen={isOpen}
					onOpenChange={setIsOpen}
				/>
			</FeaturePreviewOn>
		</FeaturePreview>
	);
};

export default memo(UserMenu);
