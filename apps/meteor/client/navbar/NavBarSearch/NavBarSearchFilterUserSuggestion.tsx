import type { SearchUserSuggestionSource } from '@rocket.chat/ai-search';
import { Box, SidebarItemIcon } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement } from 'react';
import { memo } from 'react';

import NavBarSearchItem from './NavBarSearchItem';
import { ReactiveUserStatus } from '../../components/UserStatus';

export type NavBarSearchFilterUserSuggestionProps = {
	user: SearchUserSuggestionSource;
} & Partial<ComponentProps<typeof NavBarSearchItem>>;

const NavBarSearchFilterUserSuggestion = ({ user, ...props }: NavBarSearchFilterUserSuggestionProps): ReactElement => (
	<NavBarSearchItem
		{...props}
		title={user.name || user.username}
		avatar={<UserAvatar size='x20' username={user.username} etag={user.avatarETag} />}
		icon={<SidebarItemIcon icon={<ReactiveUserStatus uid={user._id} />} />}
		actions={
			<Box color='hint' fontScale='c1' flexShrink={0} maxWidth='x160' withTruncatedText>
				@{user.username}
			</Box>
		}
	/>
);

export default memo(NavBarSearchFilterUserSuggestion);
