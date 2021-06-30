import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../app/callbacks/client';
import { useRoute } from '../contexts/RouterContext';
import { useUser } from '../contexts/UserContext';

export default function useLogout(): () => void {
	const router = useRoute('home');
	const user = useUser();

	const handleLogout = useMutableCallback(() => {
		Meteor.logout(() => {
			callbacks.run('afterLogoutCleanUp', user);
			Meteor.call('logoutCleanUp', user);
			router.push({});
		});
	});

	return handleLogout;
}
