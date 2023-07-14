import { useEffect } from 'react';

import { ui } from '../../lib/ui';
import { MemberListRouter } from '../../views/room';

export const useUserInfoRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('user-info', {
			groups: ['direct'],
			id: 'user-info',
			title: 'User_Info',
			icon: 'user',
			template: MemberListRouter,
			order: 1,
		});
	}, []);
};
