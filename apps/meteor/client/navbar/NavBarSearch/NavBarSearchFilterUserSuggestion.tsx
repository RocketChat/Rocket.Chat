import type { SearchUserSuggestionSource } from '@rocket.chat/ai-search';
import { Box, SidebarItemIcon } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactElement } from 'react';
import { memo } from 'react';

import NavBarSearchItem from './NavBarSearchItem';
import { ReactiveUserStatus } from '../../components/UserStatus';

export type NavBarSearchFilterUserSuggestionProps = {
	user: SearchUserSuggestionSource;
	description: string;
	onClick: (event: MouseEvent) => void;
};

const NavBarSearchFilterUserSuggestion = ({ user, description, onClick }: NavBarSearchFilterUserSuggestionProps): ReactElement => {
	const useRealName = useSetting('UI_Use_Real_Name');
	const title = useRealName ? user.name || user.username : user.username;

	return (
		<NavBarSearchItem
			title={title}
			avatar={<UserAvatar size='x20' username={user.username} etag={user.avatarETag} />}
			icon={<SidebarItemIcon icon={<ReactiveUserStatus uid={user._id} />} />}
			actions={
				<Box color='hint' fontScale='c1' flexShrink={0}>
					{description}
				</Box>
			}
			onClick={onClick}
		/>
	);
};

export default memo(NavBarSearchFilterUserSuggestion);
