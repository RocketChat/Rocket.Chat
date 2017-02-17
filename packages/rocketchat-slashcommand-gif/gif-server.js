/*
* Gif is a named function that will replace /gimme commands
* @param {Object} message - The message object
*/


function Gif(command, params, item) {
	if (command === 'gif') {
		let msg;
		let url = 'https://rightgif.com/search/web';

		msg = item;
		msg.msg = '';
		HTTP.post(url, {
			headers: {
				"content-type": "application/json"
			},
			data: {
				text: params
			}
		}, function(err, response) {
			if (err || response.statusCode != 200 || response.data.url === 'https://rightgif.com/public/images/error.gif') {
				let currentUser = Meteor.users.findOne(Meteor.userId());
				RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
					_id: Random.id(),
					rid: msg.rid,
					ts: new Date(),
					msg: TAPi18n.__('Slash_Gif_Failed', null, currentUser.language)
				});
			} else {
				msg.attachments = [ {title: params, image_url: response.data.url} ];
				msg.groupable = false;
				Meteor.call('sendMessage', msg);
			}
		});
	}
}

RocketChat.slashCommands.add('gif', Gif, {
	description: 'Slash_Gif_Description',
	params: 'gif_keyword'
});
