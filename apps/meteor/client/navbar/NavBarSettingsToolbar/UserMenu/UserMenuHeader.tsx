import type { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';

type UserMenuHeaderProps = { user: IUser };

const UserMenuHeader = ({ user }: UserMenuHeaderProps) => {
	const displayName = useUserDisplayName(user);

	return (
		<Box display='flex' flexDirection='row' alignItems='center' minWidth='x208' mbe='neg-x4' mbs='neg-x8'>
			<Box mie={4}>
				<UserAvatar size='x36' username={user?.username || ''} etag={user?.avatarETag} />
			</Box>
			<Box mis={4} display='flex' overflow='hidden' flexDirection='column' fontScale='p2' flexGrow={1} flexShrink={1}>
				<Box withTruncatedText w='full' is='span' fontWeight='700'>
					{displayName}
				</Box>
			</Box>
		</Box>
	);
};

export default UserMenuHeader;
