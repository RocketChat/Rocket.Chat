import { Meteor } from 'meteor/meteor';

import { Users } from '/app/models/server';
import ChannelHandler from '/app/ws/channelHandler';

class LoginStream extends Meteor.Streamer {
	_publish(publication, eventName, options) {
		super._publish(publication, eventName, options);
		const connectionId = publication?._session?.id;
		console.log(publication?.id, publication?._session?.id);
		publication.onStop(() => {
			console.log('Publication onStop', connectionId);
			ChannelHandler.unsubscribe(Meteor.userId(), connectionId);
		});
	}
}

const loginStream = new LoginStream('channel-subscriber');

loginStream.allowRead(function(eventName, extraData) {
	const [userId, token] = eventName.split('/');
	if (!userId || !token) { return false; }
	const user = Users.findOneByIdAndLoginToken(userId, token);
	if (!user) { return false; }

	ChannelHandler.subscribe(userId, this.connection.id);
	return true;
}); // TODO-Hi: think what do it in client if the sub wasn't completed

export default loginStream;
