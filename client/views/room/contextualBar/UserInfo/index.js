import { memo } from 'react';

import InfoPanel from '../../../InfoPanel';
import Action from './Action';
import Avatar from './Avatar';
import UserInfoWithData from './UserInfoWithData';
import Username from './Username';

export default Object.assign(memo(UserInfoWithData), {
	Action,
	Avatar,
	Info: InfoPanel.Text,
	Label: InfoPanel.Label,
	Username,
});
