Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'message_snippeted',
		system: true,
		message: 'Snippeted_a_message',
		data: function(message) {
			let snippetLink = `<a href="/snippet/${message.snippetId}/${message.filename}">${message.filename}</a>`;
			return {snippetLink: snippetLink}
		}
	});
});
