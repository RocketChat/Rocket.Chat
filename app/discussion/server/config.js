import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import { DiscussionRoomType } from '../lib/discussionRoomType';
import { commonUtils, roomCommonUtils, roomTypes, userCommonUtils } from '../../utils/server';
import { Rooms, Subscriptions, Users } from '../../models/server';
import { AuthorizationUtils } from '../../authorization/server';

Meteor.startup(() => {
	settings.addGroup('Discussion', function() {
		// the channel for which discussions are created if none is explicitly chosen

		this.add('Discussion_enabled', true, {
			group: 'Discussion',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});
	});

	settings.add('Accounts_Default_User_Preferences_sidebarShowDiscussion', true, {
		group: 'Accounts',
		section: 'Accounts_Default_User_Preferences',
		type: 'boolean',
		public: true,
		i18nLabel: 'Group_discussions',
	});

	const globalQuery = {
		_id: 'RetentionPolicy_Enabled',
		value: true,
	};

	settings.add('RetentionPolicy_DoNotExcludeDiscussion', true, {
		group: 'RetentionPolicy',
		section: 'Global Policy',
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_DoNotExcludeDiscussion',
		i18nDescription: 'RetentionPolicy_DoNotExcludeDiscussion_Description',
		enableQuery: globalQuery,
	});
});

roomTypes.add(new DiscussionRoomType({
	settings,
	Users,
	Rooms,
	Subscriptions,
	AuthorizationUtils,
	RoomCommonUtils: roomCommonUtils,
	CommonUtils: commonUtils,
	RoomTypesCommon: roomTypes,
},
userCommonUtils));
