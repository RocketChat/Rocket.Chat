import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings';
import { Users, Messages } from '../../../app/models';
import { msgStream } from '../../../app/lib/server';

import { MY_MESSAGE } from '.';

Meteor.startup(function() {
	function publishMessage(type, record) {
		if (record._hidden !== true && (record.imported == null)) {
			const UI_Use_Real_Name = settings.get('UI_Use_Real_Name') === true;

			if (record.u && record.u._id && UI_Use_Real_Name) {
				const user = Users.findOneById(record.u._id);
				record.u.name = user && user.name;
			}

			if (record.mentions && record.mentions.length && UI_Use_Real_Name) {
				record.mentions.forEach((mention) => {
					const user = Users.findOneById(mention._id);
					mention.name = user && user.name;
				});
			}
			msgStream.mymessage(MY_MESSAGE, record);
			msgStream.emitWithoutBroadcast(record.rid, record);
		}
	}

	return Messages.on('change', function({ clientAction, id, data/* , oplog*/ }) {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const message = data ?? Messages.findOne({ _id: id });
				publishMessage(clientAction, message);
				break;
		}
	});
});
