import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import * as banners from '../../../client/lib/banners';

Meteor.startup(function () {
	Tracker.autorun(() => {
		const user = Meteor.user();

		if (user && Object.keys(user.banners || {}).length > 0) {
			const firstBanner = Object.values(user.banners)
				.filter((b) => b.read !== true)
				.sort((a, b) => b.priority - a.priority)[0];

			if (!firstBanner) {
				return;
			}

			firstBanner.textArguments = firstBanner.textArguments || [];

			banners.open({
				id: firstBanner.id,
				title: TAPi18n.__(firstBanner.title),
				text: TAPi18n.__(firstBanner.text, ...firstBanner.textArguments),
				modifiers: firstBanner.modifiers,
				action() {
					if (firstBanner.link) {
						window.open(firstBanner.link, '_system');
					}
				},
				onClose() {
					Meteor.call('banner/dismiss', {
						id: firstBanner.id,
					});
				},
			});
		}
	});
});
