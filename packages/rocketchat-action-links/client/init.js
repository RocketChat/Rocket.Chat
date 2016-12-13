/* globals fireGlobalEvent */
Template.room.events({
	'click .action-link'(event) {
		event.preventDefault();
		event.stopPropagation();

		const data = Blaze.getData(event.currentTarget);

		if (RocketChat.Layout.isEmbedded()) {
			return fireGlobalEvent('click-action-link', {
				actionlink: $(event.currentTarget).data('actionlink'),
				value: data._arguments[1]._id,
				message: data._arguments[1]
			});
		}

		if (data && data._arguments && data._arguments[1] && data._arguments[1]._id) {
			Meteor.call('actionLinkHandler', $(event.currentTarget).data('actionlink'), data._arguments[1]._id, (err) => {
				if (err) {
					handleError(err);
				}
			});
		}
	}
});
