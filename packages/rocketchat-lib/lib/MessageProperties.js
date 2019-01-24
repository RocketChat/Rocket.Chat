import { messageProperties } from 'meteor/rocketchat:ui-utils';

export {
	messageProperties,
};

// check for tests
if (typeof RocketChat !== 'undefined') {
	RocketChat.messageProperties = messageProperties;
}
