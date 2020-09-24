import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IStreamer, STATUS_MAP } from '../../sdk/types/IStreamer';
// import { Notifications } from '../../../app/notifications/server';

export class Streamer extends ServiceClass implements IStreamer {
	protected name = 'streamer';

	private streamLogged: any;

	constructor(Streamer: any) {
		super();

		this.streamLogged = new Streamer('notify-logged');
		this.streamLogged.allowWrite('none');
		this.streamLogged.allowRead('logged');
	}

	sendUserStatus({ uid, username, status, statusText }: { uid: string; username: string; status: STATUS_MAP; statusText?: string }): void {
		this.streamLogged.emit('user-status', [
			uid,
			username,
			status,
			statusText,
		]);
	}

	notifyAll(eventName: string, ...args: any[]): void {
		console.log('notifyAll', eventName, args);
	}

	notifyUser(uid: string, eventName: string, ...args: any[]): void {
		console.log('notifyUser', uid, eventName, args);
	}
}
