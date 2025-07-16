import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement } from 'react';

const UserInfoAvatar = (props: ComponentProps<typeof UserAvatar>): ReactElement => <UserAvatar size='x332' {...props} />;

export default UserInfoAvatar;
