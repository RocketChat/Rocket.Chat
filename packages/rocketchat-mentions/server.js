/*
* Mentions is a named function that will process Mentions
* @param {Object} message - The message object
*/

function MentionsServer(message) {
	const msgMentionRegex = new RegExp(`(?:^|\\s|\\n)(?:@)(${ RocketChat.settings.get('UTF8_Names_Validation') })`, 'g');
	const mentionsAll = [];
	const userMentions = [];
	let mentions = message.msg.match(msgMentionRegex);
	if (mentions) {
		mentions.forEach((m) => {
			const mention = m.trim().substr(1);
			if (mention !== 'all' && mention !== 'here') {
				return userMentions.push(mention);
			}
			if (mention === 'all') {
				const messageMaxAll = RocketChat.settings.get('Message_MaxAll');
				const allChannel = RocketChat.models.Rooms.findOneById(message.rid);
				if (messageMaxAll !== 0 && allChannel.usernames.length >= messageMaxAll) {
					return;
				}
			}
			mentionsAll.push({
				_id: mention,
				username: mention
			});
		});
		mentions = userMentions.length ? Meteor.users.find({ username: {$in: _.unique(userMentions)}}, { fields: {_id: true, username: true }}).fetch() : [];

		const verifiedMentions = [...mentionsAll, ...mentions];
		if (verifiedMentions.length !== 0) {
			message.mentions = verifiedMentions;
		}
	}

	const msgChannelRegex = new RegExp(`(?:^|\\s|\\n)(?:#)(${ RocketChat.settings.get('UTF8_Names_Validation') })`, 'g');
	let channels = message.msg.match(msgChannelRegex);
	if (channels) {
		channels = channels.map(c => c.trim().substr(1));
		const verifiedChannels = RocketChat.models.Rooms.find({ name: {$in: _.unique(channels)}, t: 'c'	}, { fields: {_id: 1, name: 1 }}).fetch();
		if (verifiedChannels.length !== 0) {
			message.channels = verifiedChannels;
		}
	}
	return message;
}

RocketChat.callbacks.add('beforeSaveMessage', MentionsServer, RocketChat.callbacks.priority.HIGH, 'mentions');
