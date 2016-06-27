Meteor.methods
	phoneNumberOffer: (rid, number, message) ->
		RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('phone_dial_a_number', rid, '', Meteor.user(), {
			actionLinks : [
				{
					icon: 'icon-phone',
					label: message,
					method_id: 'phoneDoCall',
					params: number
				}
			]
		})

