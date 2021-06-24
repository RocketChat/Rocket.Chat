import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Notifications } from '../../../notifications';
import { OEmbed } from '../../../models';
import { oembed } from '../providers';

Meteor.methods({
	insertOrUpdateOembed(oembedData) {
		if (!hasPermission(this.userId, 'manage-own-incoming-integrations')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(oembedData.endPoint)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field EndPoint is required', { method: 'insertOrUpdateOembed', field: 'EndPoint' });
		}

		const endPointValidation = /^https?:\/\//;

		if (oembedData.urls) {
			if (!Array.isArray(oembedData.urls)) {
				oembedData.urls = oembedData.urls.split(/[\s,]/);
			}
			oembedData.urls = oembedData.urls.filter(Boolean);
		}

		if (!endPointValidation.test(oembedData.endPoint)) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${ oembedData.endPoint } is not a valid endpoint`, { method: 'insertOrUpdateOembed', input: oembedData.endPoint, field: 'EndPoint' });
		}

		let matchingResults = [];

		if (oembedData._id) {
			matchingResults = OEmbed.findByEndPointExceptId(oembedData.endPoint, oembedData._id).fetch();
		} else {
			matchingResults = OEmbed.findByEndPoint(oembedData.endPoint).fetch();
		}

		if (matchingResults.length > 0) {
			throw new Meteor.Error('OEmbed_Error_EndPoint_Already_In_Use', 'The oembed is already in use', { method: 'insertOrUpdateOembed' });
		}

		if (!oembedData._id) {
			// insert oembed
			const createOembed = {
				urls: oembedData.urls.map((url) => new RegExp(url)),
				endPoint: oembedData.endPoint,
			};

			const _id = OEmbed.create(createOembed);

			Notifications.notifyLogged('updateOembed', { oembedData: createOembed });

			oembed.providers.loadProviders();
			return _id;
		}
		// update oembed
		if (oembedData.endPoint !== oembedData.previousEndPoint) {
			OEmbed.setEndPoint(oembedData._id, oembedData.endPoint);
		}

		OEmbed.setUrls(oembedData._id, oembedData.urls);

		Notifications.notifyLogged('updateOembed', { oembedData });

		oembed.providers.loadProviders();
		return true;
	},
});
