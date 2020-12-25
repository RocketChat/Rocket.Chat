import UserStatus from './UserStatus';
import UserStatusBusy from './UserStatusBusy';
import UserStatusAway from './UserStatusAway';
import UserStatusOnline from './UserStatusOnline';
import UserStatusOffline from './UserStatusOffline';
import UserStatusLoading from './UserStatusLoading';

export default Object.assign(UserStatus, {
	Busy: UserStatusBusy,
	Away: UserStatusAway,
	Online: UserStatusOnline,
	Offline: UserStatusOffline,
	Loading: UserStatusLoading,
});
