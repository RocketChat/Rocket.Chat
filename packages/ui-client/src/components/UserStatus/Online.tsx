import type { UserStatusProps } from './UserStatus';
import UserStatus from './UserStatus';

export type OnlineProps = Omit<UserStatusProps, 'status'>;

function Online(props: OnlineProps) {
	return <UserStatus status='online' {...props} />;
}

export default Online;
