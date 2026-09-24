import type { ServerMethods } from '@rocket.chat/ddp-client';
import { NotificationsModule, Streamer } from '@rocket.chat/streamer';
import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';

class Stream extends Streamer<'local'> {
	registerPublication(name: string, fn: (eventName: string, options: boolean | { useCollection?: boolean; args?: any }) => void): void {
		Meteor.publish(name, function (eventName, options) {
			return fn.call(this, eventName, options);
		});
	}

	registerMethod(methods: Partial<ServerMethods>): void {
		Meteor.methods(methods);
	}

	changedPayload(collection: string, id: string, fields: Record<string, any>): string | false {
		return DDPCommon.stringifyDDP({
			msg: 'changed',
			collection,
			id,
			fields,
		});
	}
}

const notifications = new NotificationsModule(Stream);

notifications.configure();

export default notifications;
