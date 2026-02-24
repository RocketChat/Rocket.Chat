import type { UserStatusProps } from './UserStatus';
import UserStatus from './UserStatus';

type LoadingProps = Omit<UserStatusProps, 'status'>;

function Loading(props: LoadingProps) {
	return <UserStatus {...props} />;
}

export default Loading;
