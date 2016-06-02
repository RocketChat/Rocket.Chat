Template.room.events({
	'click .action-link'(event) {
		event.preventDefault();
		event.stopPropagation();
		const data = Blaze.getData(event.currentTarget);

		if (data && data._arguments && data._arguments[1] && data._arguments[1]._id) {
			Meteor.call('actionLinkHandler', event.currentTarget.childNodes[1].name, data._arguments[1]._id, (err) => {
				if (err) {
					handleError(err);
				}
			});
		}
	}
});
