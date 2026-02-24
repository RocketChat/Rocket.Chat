import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement } from 'react';
import { memo } from 'react';

// Memoized to prevent re-renders when parent component updates
const UserInfoAvatar = memo((props: ComponentProps<typeof UserAvatar>): ReactElement => <UserAvatar size='x332' {...props} />);

export default UserInfoAvatar;
