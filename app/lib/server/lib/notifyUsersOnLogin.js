import { callbacks } from '../../../callbacks/server';
import { notifyStream, shouldNotifyStream } from '../functions/notifications/stream';

callbacks.add('afterValidateLogin', (login) => {
	const { user } = login;
	if (user && shouldNotifyStream()) {
		notifyStream(user._id);
	}
}, callbacks.priority.LOW, 'notify-users-on-login');
