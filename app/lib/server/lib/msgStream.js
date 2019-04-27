import { Meteor } from 'meteor/meteor';
import { DDPCommon } from 'meteor/ddp-common';

const changedPayload = function(collection, id, fields) {
	return DDPCommon.stringifyDDP({
		msg: 'changed',
		collection,
		id,
		fields,
	});
};

const send = function(self, msg) {
	if (!self.socket) {
		return;
	}
	self.socket.send(msg);
};

class MessageStream extends Meteor.Streamer {
	mymessage = (eventName, args) => {
		const subscriptions = this.subscriptionsByEventName[eventName];
		if (!Array.isArray(subscriptions)) {
			return;
		}
		subscriptions.forEach(({ subscription }) => {
			const options = this.isEmitAllowed(subscription, eventName, args);
			if (options) {
				send(subscription._session, changedPayload(this.subscriptionName, 'id', {
					eventName,
					args: [args, options],
				}));
			}
		});
	}
}

export const msgStream = new MessageStream('room-messages');
