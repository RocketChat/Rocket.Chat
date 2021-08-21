import { Meteor } from 'meteor/meteor';

import { RoomTypeConfig, roomTypes, getUserPreference } from '../../utils/server';
import type { SettingValue } from '../../../definition/ISetting';

export class DiscussionRoomType extends RoomTypeConfig {
	customTemplate: string;

	constructor() {
		super({
			identifier: 't',
			order: 25,
			label: 'Discussion',
		});

		// we need a custom template in order to have a custom query showing the subscriptions to discussions
		this.customTemplate = 'DiscussionList';
	}

	condition(): SettingValue {
		return getUserPreference(Meteor.userId(), 'sidebarShowDiscussion');
	}
}

roomTypes.add(new DiscussionRoomType());
