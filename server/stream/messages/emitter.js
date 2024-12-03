import { Meteor } from 'meteor/meteor';

import { msgStream } from '../../../app/lib/server';
import { Messages, Users } from '../../../app/models';
import { settings } from '../../../app/settings';

import { MY_MESSAGE } from '.';


import redis from '/app/redis/redis';


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

	const handleMessage = (clientAction, data, id) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const message = data || Messages.findOne({ _id: id });
				publishMessage(clientAction, message);

				break;
		}
	};

	const redisMessageHandle = (channel, redisObj) => {
		const data = JSON.stringify(redisObj);
		return handleMessage('inserted', data, data._id);
	};


	if (settings.get('Use_Oplog_As_Real_Time')) {
		Messages.on('change', function({ clientAction, id, data/* , oplog*/ }) {
			handleMessage(clientAction, data, id);
		});
	} else {
		console.log('redis on message');
		redis.on('message', redisMessageHandle);
	}
});
