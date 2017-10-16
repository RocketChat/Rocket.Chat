Meteor.methods({
	'assistify:isValidExpertise'(expertise) {

		const options = {
			fields: {
				name: 1,
				t: 1
			}
		};

		const cursorHandle = RocketChat.models.Rooms.findByNameAndTypesNotContainingUsername(expertise, ['e'], '', options);
		return !!cursorHandle.fetch().length;
	}
});
