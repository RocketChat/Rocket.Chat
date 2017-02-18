/*
* Gif is a named function that will replace /gimme commands
* @param {Object} message - The message object
*/


function Gif(command, params, item) {
	if (command === 'gif') {
		const url = 'https://rightgif.com/search/web';

		item.msg = '';
		HTTP.post(url, {
			headers: {
				'content-type': 'application/json'
			},
			data: {
				text: params
			}
		}, function(err, response) {
			if (err || response.statusCode !== 200 || response.data.url === 'https://rightgif.com/public/images/error.gif') {
				const currentUser = Meteor.users.findOne(Meteor.userId());
				RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
					_id: Random.id(),
					rid: item.rid,
					ts: new Date(),
					msg: TAPi18n.__('Slash_Gif_Failed', null, currentUser.language)
				});
			} else {
				item.attachments = [ {title: params, image_url: response.data.url} ];
				item.groupable = false;
				Meteor.call('sendMessage', item);
			}
		});
	}
}

RocketChat.slashCommands.add('gif', Gif, {
	description: 'Slash_Gif_Description',
	params: 'gif_keyword'
});
