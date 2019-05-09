import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Subscriptions, Rooms, Users } from '../../../models/client';
import { hasPermission } from '../../../authorization/client';
import { settings } from '../../../settings/client';
import { getUserPreference } from '../../../utils/client';

export function messageContext({ rid } = Template.instance()) {
	const uid = Meteor.userId();
	return {
		u: Users.findOne({ _id: uid }, { fields: { name: 1, username: 1 } }),
		room: Rooms.findOne({ _id: rid }, {
			reactive: false,
			fields: {
				_updatedAt: 0,
				lastMessage: 0,
			},
		}),
		subscription: Subscriptions.findOne({ rid }, {
			fields: {
				name: 1,
				autoTranslate: 1,
				rid: 1,
			},
		}),
		settings: {
			showreply: true,
			showReplyButton: true,
			hasPermissionDeleteMessage: hasPermission('delete-message', rid),
			hideRoles: !settings.get('UI_DisplayRoles') || getUserPreference(uid, 'hideRoles'),
			UI_Use_Real_Name: settings.get('UI_Use_Real_Name'),
			Chatops_Username: settings.get('Chatops_Username'),
			AutoTranslate_Enabled: settings.get('AutoTranslate_Enabled'),
			Message_AllowEditing: settings.get('Message_AllowEditing'),
			Message_AllowEditing_BlockEditInMinutes: settings.get('Message_AllowEditing_BlockEditInMinutes'),
			Message_ShowEditedStatus: settings.get('Message_ShowEditedStatus'),
			API_Embed: settings.get('API_Embed'),
			API_EmbedDisabledFor: settings.get('API_EmbedDisabledFor'),
			Message_GroupingPeriod: settings.get('Message_GroupingPeriod') * 1000,
		},
	};
}
