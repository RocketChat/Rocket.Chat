import type { UserStatusProps } from './UserStatus';
import UserStatus from './UserStatus';

export type BusyProps = Omit<UserStatusProps, 'status'>;

function Busy(props: BusyProps) {
	return <UserStatus status='busy' {...props} />;
}

export default Busy;
