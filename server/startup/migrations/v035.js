RocketChat.Migrations.add({
	version: 35,
	up() {
		return RocketChat.models.Messages.update({
			'file._id': {
				$exists: true
			},
			'attachments.title_link': {
				$exists: true
			},
			'attachments.title_link_download': {
				$exists: false
			}
		}, {
			$set: {
				'attachments.$.title_link_download': true
			}
		}, {
			multi: true
		});
	}
});
