import type { UserStatusProps } from './UserStatus.js';
import UserStatus from './UserStatus.js';

export type LoadingProps = Omit<UserStatusProps, 'status'>;

function Loading(props: LoadingProps) {
	return <UserStatus {...props} />;
}

export default Loading;
