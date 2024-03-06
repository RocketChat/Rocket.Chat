import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { onUserActivity } from '../lib/room';

export const useUserActivitySubscription = (rid: string) => {
	const stream = useStream('notify-room');

	useEffect(() => {
		return stream(`${rid}/user-activity`, (username, activities) => {
			onUserActivity(username, activities);
		});
	}, [rid, stream]);
};
