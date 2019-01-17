import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Subscriptions.removeByVisitorToken = function(token) {
	const query = {
		'v.token': token,
	};

	this.remove(query);
};
