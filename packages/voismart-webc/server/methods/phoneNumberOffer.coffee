Meteor.methods
	phoneNumberOffer: (rid, number, message) ->
		url = "voismart://call/" + number

		RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('webc_audioconf', rid, '', Meteor.user(), {
			actionLinks : [
				{
					icon: 'icon-phone',
					label: message,
					method_id: 'webcAudioConf',
					params:
						number: number
						url: url
				}
			]
		})
