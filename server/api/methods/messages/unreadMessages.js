import { Meteor } from 'meteor/meteor';

import { unreadMessages } from '../../../services/messages/functions/unreadMessages';

Meteor.methods({
	unreadMessages,
});
