/* globals getAvatarUrlFromUsername */

const QueryString = Npm.require('querystring');

RocketChat.callbacks.add('oembed:afterParseContent', (data) => {
	console.log(data);
	if (data.parsedUrl && data.parsedUrl.query) {
		let queryString = data.parsedUrl.query;
		if (_.isString(queryString)) {
			queryString = QueryString.parse(queryString);
			if (_.isString(queryString.j)) { // Jump-to query param
				let jumpToMessage = RocketChat.models.Messages.findOneById(queryString.j);
				console.log(jumpToMessage);
				if (jumpToMessage) {
					let attachments = [
						{
							'text' : jumpToMessage.msg,
							'author_name' : jumpToMessage.u.username,
							'author_icon' : getAvatarUrlFromUsername(jumpToMessage.u.username)
						}
					];
					// RocketChat.models.Messages.setMessageAttachments(message._id, attachments);
					console.log(attachments);
				}
			}
		}
	}
}, RocketChat.callbacks.priority.LOW);
