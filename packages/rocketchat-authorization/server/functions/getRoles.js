import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.authz.getRoles = function() {
	return RocketChat.models.Roles.find().fetch();
};
