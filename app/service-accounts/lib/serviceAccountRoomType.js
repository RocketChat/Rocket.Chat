import { Meteor } from 'meteor/meteor';

import { RoomTypeConfig, roomTypes, getUserPreference } from '../../utils';

export class ServiceAccountRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'sa',
			order: 60,
			label: 'Subscriptions',
		});

		// we need a custom template in order to have a custom query showing the subscriptions to serviceAccounts
		this.customTemplate = 'serviceAccountsList';
	}

	condition() {
		return getUserPreference(Meteor.userId(), 'sidebarShowServiceAccounts');
	}
}

roomTypes.add(new ServiceAccountRoomType());
