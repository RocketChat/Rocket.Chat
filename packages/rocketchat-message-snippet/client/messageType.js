Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'message_snippeted',
		system: true,
		message: 'Snippeted_a_message',
		data: function(message) {
			let snippetLink = `<a href="/snippet/${message.snippetId}/${message.snippetName}">${message.snippetName}</a>`;
			return { snippetLink: snippetLink };
		}
	});
});
