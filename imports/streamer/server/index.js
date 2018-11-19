import { Meteor } from 'meteor/meteor';
import * as MQ from './messageqeue';

const mq = MQ.create();

if (mq) {
	Meteor.StreamerCentral.on('broadcast', function(streamName, eventName, args) {
		mq.publish(streamName, { eventName, args });
	});

	mq.subscribe((streamName, { eventName, args }) => {

		const instance = Meteor.StreamerCentral.instances[streamName];
		if (!instance) {
			return 'stream-not-exists';
		}
		instance.emitWithoutBroadcast(eventName, args);

	});
}
