import { Meteor } from 'meteor/meteor';

import { pinMessage, unpinMessage } from '../../../services/messages/functions/pinMessage';

Meteor.methods({
	pinMessage,
	unpinMessage,
});
