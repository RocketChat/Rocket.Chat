import InfoPanel from '../InfoPanel';
import UserInfo from './UserInfo';
import UserInfoAction from './UserInfoAction';
import UserInfoAvatar from './UserInfoAvatar';
import UserInfoUsername from './UserInfoUsername';

export default Object.assign(UserInfo, {
	Action: UserInfoAction,
	Avatar: UserInfoAvatar,
	Info: InfoPanel.Text,
	Label: InfoPanel.Label,
	Username: UserInfoUsername,
});
