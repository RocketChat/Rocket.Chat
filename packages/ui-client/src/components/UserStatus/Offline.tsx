import type { UserStatusProps } from './UserStatus';
import UserStatus from './UserStatus';

type OfflineProps = Omit<UserStatusProps, 'status'>;

function Offline(props: OfflineProps) {
	return <UserStatus status='offline' {...props} />;
}

export default Offline;
