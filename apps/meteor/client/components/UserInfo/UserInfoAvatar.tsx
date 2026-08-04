import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps } from 'react';

export type UserInfoAvatarProps = ComponentProps<typeof UserAvatar>;

const UserInfoAvatar = (props: UserInfoAvatarProps) => <UserAvatar size='x332' {...props} />;

export default UserInfoAvatar;
