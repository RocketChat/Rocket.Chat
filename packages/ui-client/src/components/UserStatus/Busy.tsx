import type { UserStatusProps } from './UserStatus.js';
import UserStatus from './UserStatus.js';

export type BusyProps = Omit<UserStatusProps, 'status'>;

function Busy(props: BusyProps) {
	return <UserStatus status='busy' {...props} />;
}

export default Busy;
