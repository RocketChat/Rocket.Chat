import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { handleError } from '/app/utils';
import { fireGlobalEvent, Layout } from '/app/ui-utils';
import { actionLinks } from '../both/lib/actionLinks';

Template.room.events({
	'click .action-link'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const data = Blaze.getData(event.currentTarget);

		if (Layout.isEmbedded()) {
			return fireGlobalEvent('click-action-link', {
				actionlink: $(event.currentTarget).data('actionlink'),
				value: data._arguments[1]._id,
				message: data._arguments[1],
			});
		}

		if (data && data._arguments && data._arguments[1] && data._arguments[1]._id) {
			actionLinks.run($(event.currentTarget).data('actionlink'), data._arguments[1]._id, instance, (err) => {
				if (err) {
					handleError(err);
				}
			});
		}
	},
});
