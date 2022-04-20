import UserCard from './UserCard';
import UserCardAction from './UserCardAction';
import UserCardInfo from './UserCardInfo';
import UserCardRole from './UserCardRole';
import UserCardRoles from './UserCardRoles';
import UserCardUsername from './UserCardUsername';

export default Object.assign(UserCard, {
	Action: UserCardAction,
	Role: UserCardRole,
	Roles: UserCardRoles,
	Info: UserCardInfo,
	Username: UserCardUsername,
});
