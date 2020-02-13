import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import { handleError } from '../../utils';
import { fireGlobalEvent, Layout } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { actionLinks } from '../both/lib/actionLinks';


Template.room.events({
	'click .action-link'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const data = Blaze.getData(event.currentTarget);
		const { msg } = messageArgs(data);
		if (Layout.isEmbedded()) {
			return fireGlobalEvent('click-action-link', {
				actionlink: $(event.currentTarget).data('actionlink'),
				value: msg._id,
				message: msg,
			});
		}

		if (msg._id) {
			actionLinks.run($(event.currentTarget).data('actionlink'), msg._id, instance, (err) => {
				if (err) {
					handleError(err);
				}
			});
		}
	},
});
