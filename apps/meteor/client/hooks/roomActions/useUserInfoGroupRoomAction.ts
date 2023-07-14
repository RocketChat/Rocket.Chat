import { useEffect } from 'react';

import { ui } from '../../lib/ui';
import { MemberListRouter } from '../../views/room';

export const useUserInfoGroupRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('user-info-group', {
			groups: ['direct_multiple'],
			id: 'user-info-group',
			title: 'Members',
			icon: 'members',
			template: MemberListRouter,
			order: 1,
		});
	}, []);
};
