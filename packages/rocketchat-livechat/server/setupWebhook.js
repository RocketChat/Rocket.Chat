/* globals HTTP */
let sendOnCloseLivechat = false;
let sendOnOfflineMessage = false;
let webhookURL = '';

RocketChat.settings.get('Livechat_webhook_on_close', function(key, value) {
	sendOnCloseLivechat = value;
});

RocketChat.settings.get('Livechat_webhook_on_offline_msg', function(key, value) {
	sendOnOfflineMessage = value;
});

RocketChat.settings.get('Livechat_webhookUrl', function(key, value) {
	webhookURL = value;
});

const sendRequest = (postData, trying = 1) => {
	try {
		HTTP.post(webhookURL, { data: postData });
	} catch (e) {
		RocketChat.Livechat.logger.webhook.error('Response error on ' + trying + ' try ->', e);
		// try 10 times after 10 seconds each
		if (trying < 10) {
			RocketChat.Livechat.logger.webhook.info('Try again in 10 seconds.');
			trying++;
			setTimeout(Meteor.bindEnvironment(() => {
				sendRequest(postData, trying);
			}), 10000);
		}
	}
};

RocketChat.callbacks.add('closeLivechat', (room) => {
	if (!sendOnCloseLivechat) {
		return room;
	}

	const visitor = RocketChat.models.Users.findOneById(room.v._id);
	const agent = RocketChat.models.Users.findOneById(room.servedBy._id);

	const ua = new UAParser();
	ua.setUA(visitor.userAgent);

	let postData = {
		type: 'LivechatSession',
		_id: room._id,
		label: room.label,
		topic: room.topic,
		code: room.code,
		createdAt: room.ts,
		lastMessageAt: room.lm,
		tags: room.tags,
		customFields: room.livechatData,
		visitor: {
			_id: visitor._id,
			name: visitor.name,
			username: visitor.username,
			email: null,
			phone: null,
			department: visitor.department,
			ip: visitor.ip,
			os: ua.getOS().name && (ua.getOS().name + ' ' + ua.getOS().version),
			browser: ua.getBrowser().name && (ua.getBrowser().name + ' ' + ua.getBrowser().version),
			customFields: visitor.livechatData
		},
		agent: {
			_id: agent._id,
			username: agent.username,
			name: agent.name,
			email: null
		},
		messages: []
	};

	if (visitor.emails && visitor.emails.length > 0) {
		postData.visitor.email = visitor.emails[0].address;
	}
	if (visitor.phone && visitor.phone.length > 0) {
		postData.visitor.phone = visitor.phone[0].phoneNumber;
	}

	if (agent.emails && agent.emails.length > 0) {
		postData.agent.email = agent.emails[0].address;
	}

	RocketChat.models.Messages.findVisibleByRoomId(room._id, { sort: { ts: 1 } }).forEach((message) => {
		if (message.t) {
			return;
		}
		let msg = {
			username: message.u.username,
			msg: message.msg,
			ts: message.ts
		};

		if (message.u.username !== visitor.username) {
			msg.agentId = message.u._id;
		}
		postData.messages.push(msg);
	});

	sendRequest(postData);
});

RocketChat.callbacks.add('sendOfflineLivechatMessage', (data) => {
	if (!sendOnOfflineMessage) {
		return data;
	}

	let postData = {
		type: 'LivechatOfflineMessage',
		sentAt: new Date(),
		visitor: {
			name: data.name,
			email: data.email
		},
		message: data.message
	};

	sendRequest(postData);
});
