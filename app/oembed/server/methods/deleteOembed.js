import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Notifications } from '../../../notifications';
import { OEmbed } from '../../../models';

Meteor.methods({
	deleteOembed(oembedID) {
		let oembed = null;

		if (hasPermission(this.userId, 'manage-own-incoming-integrations')) {
			oembed = OEmbed.findOneById(oembedID);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (oembed == null) {
			throw new Meteor.Error('OEmbed_Error_Invalid', 'Invalid oembed', { method: 'deleteOembed' });
		}

		OEmbed.removeById(oembedID);
		Notifications.notifyLogged('deleteOembed', { oembedData: oembed });

		return true;
	},
});
