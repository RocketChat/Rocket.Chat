import type { SearchUserSuggestionSource } from '@rocket.chat/ai-search';
import { Box, SidebarItemIcon } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { memo } from 'react';

import NavBarSearchItem from './NavBarSearchItem';
import { ReactiveUserStatus } from '../../components/UserStatus';

export type NavBarSearchFilterUserSuggestionProps = {
	user: SearchUserSuggestionSource;
	description: string;
} & Partial<ComponentProps<typeof NavBarSearchItem>>;

const NavBarSearchFilterUserSuggestion = ({ user, description, ...props }: NavBarSearchFilterUserSuggestionProps): ReactElement => {
	const useRealName = useSetting('UI_Use_Real_Name');
	const title = useRealName ? user.name || user.username : user.username;

	return (
		<NavBarSearchItem
			{...props}
			title={title}
			avatar={<UserAvatar size='x20' username={user.username} etag={user.avatarETag} />}
			icon={<SidebarItemIcon icon={<ReactiveUserStatus uid={user._id} />} />}
			actions={
				<Box color='hint' fontScale='c1' flexShrink={0}>
					{description}
				</Box>
			}
		/>
	);
};

export default memo(NavBarSearchFilterUserSuggestion);
