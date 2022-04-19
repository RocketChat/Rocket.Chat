import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { handleError } from '../../utils';
import { MessageAction } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';

const START_OF_DAY = 10;

// TODO: create reusable function for reminder buttons
Meteor.startup(function () {
	MessageAction.addButton({
		id: 'remind-message-20-minutes',
		icon: 'clock',
		label: 'Remind_in_20_minutes',
		context: ['remind', 'message', 'message-mobile', 'threads'],
		async action() {
			const { msg: message } = messageArgs(this);
			const reminder = {
				ttr: moment().add(20, 'minutes').toDate(),
				permalink: await MessageAction.getPermaLink(message._id),
			};
			Meteor.call('remindMessage', message, reminder, function (error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		order: 9,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'remind-message-1-hour',
		icon: 'clock',
		label: 'Remind_in_an_hour',
		context: ['remind', 'message', 'message-mobile', 'threads'],
		async action() {
			const { msg: message } = messageArgs(this);
			const reminder = {
				ttr: moment().add(1, 'hour').toDate(),
				permalink: await MessageAction.getPermaLink(message._id),
			};
			Meteor.call('remindMessage', message, reminder, function (error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		order: 9,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'remind-message-tomorrow',
		icon: 'clock',
		label: 'Remind_tomorrow',
		context: ['remind', 'message', 'message-mobile', 'threads'],
		async action() {
			const { msg: message } = messageArgs(this);
			const reminder = {
				ttr: moment().add(1, 'd').startOf('d').set('hour', START_OF_DAY).toDate(),
				permalink: await MessageAction.getPermaLink(message._id),
			};
			Meteor.call('remindMessage', message, reminder, function (error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		order: 9,
		group: 'menu',
	});
});
