import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Tracker } from 'meteor/tracker';
import visitor from '../../imports/client/visitor';

Meteor.startup(() => {
	if (!localStorage.getItem('rocketChatLivechat')) {
		localStorage.setItem('rocketChatLivechat', Random.id());
	} else {
		Tracker.autorun((c) => {
			if (!visitor.getId() && visitor.getToken()) {
				Meteor.call('livechat:loginByToken', visitor.getToken(), (err, result) => {
					if (result && result._id) {
						visitor.setId(result._id);
						c.stop();
					}
				});
			}
		});
	}
});

Meteor.startup(() => {
	let connected = false;
	Tracker.autorun(function() {
		const connectionStatus = Meteor.status();
		if (visitor.getRoom() && visitor.getToken() && connectionStatus.connected && !connected) {
			connected = connectionStatus.connected;
			document.cookie = `rc_rid=${ visitor.getRoom() }; path=/`;
			document.cookie = `rc_token=${ visitor.getToken() }; path=/`;
			document.cookie = 'rc_room_type=l; path=/';
			visitor.setConnected();
		}
	});
});
