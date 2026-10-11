import type { UserStatusProps } from './UserStatus';
import UserStatus from './UserStatus';

export type LoadingProps = Omit<UserStatusProps, 'status'>;

function Loading(props: LoadingProps) {
	return <UserStatus {...props} />;
}

export default Loading;
