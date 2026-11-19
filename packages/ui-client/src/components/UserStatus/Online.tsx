import type { UserStatusProps } from './UserStatus.js';
import UserStatus from './UserStatus.js';

export type OnlineProps = Omit<UserStatusProps, 'status'>;

function Online(props: OnlineProps) {
	return <UserStatus status='online' {...props} />;
}

export default Online;
