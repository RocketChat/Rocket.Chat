import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';

import { Subscriptions, Rooms, Users } from '../../../models/client';
import { hasPermission } from '../../../authorization/client';
import { settings } from '../../../settings/client';
import { getUserPreference } from '../../../utils/client';
import { AutoTranslate } from '../../../autotranslate/client';
import type { CommonRoomTemplateInstance } from '../../../ui/client/views/app/lib/CommonRoomTemplateInstance';

const fields = {
	'name': 1,
	'username': 1,
	'settings.preferences.useLegacyMessageTemplate': 1,
	'settings.preferences.autoImageLoad': 1,
	'settings.preferences.saveMobileBandwidth': 1,
	'settings.preferences.collapseMediaByDefault': 1,
	'settings.preferences.hideRoles': 1,
};

export const createMessageContext = ({
	uid = Meteor.userId(),
	user = Users.findOne({ _id: uid }, { fields }) || {},
	rid = (Template.instance() as CommonRoomTemplateInstance).data.rid,
	room = Tracker.nonreactive(() =>
		Rooms.findOne(
			{ _id: rid },
			{
				fields: {
					_updatedAt: 0,
					lastMessage: 0,
				},
			},
		),
	),
	subscription = Subscriptions.findOne(
		{ rid },
		{
			fields: {
				name: 1,
				autoTranslate: 1,
				rid: 1,
				tunread: 1,
				tunreadUser: 1,
				tunreadGroup: 1,
			},
		},
	),
	translateLanguage = AutoTranslate.getLanguage(rid),
	autoImageLoad = getUserPreference(user, 'autoImageLoad'),
	useLegacyMessageTemplate = getUserPreference(user, 'useLegacyMessageTemplate'),
	saveMobileBandwidth = Meteor.Device.isPhone() && getUserPreference(user, 'saveMobileBandwidth'),
	collapseMediaByDefault = getUserPreference(user, 'collapseMediaByDefault'),
	showreply = true,
	showReplyButton = true,
	hasPermissionDeleteMessage = hasPermission('delete-message', rid),
	hasPermissionDeleteOwnMessage = hasPermission('delete-own-message'),
	hideRoles = !settings.get('UI_DisplayRoles') || getUserPreference(user, 'hideRoles'),
	// eslint-disable-next-line @typescript-eslint/naming-convention
	UI_Use_Real_Name = settings.get('UI_Use_Real_Name'),
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Chatops_Username = settings.get('Chatops_Username'),
	// eslint-disable-next-line @typescript-eslint/naming-convention
	AutoTranslate_Enabled = settings.get('AutoTranslate_Enabled'),
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Message_AllowEditing = settings.get('Message_AllowEditing'),
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Message_AllowEditing_BlockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes'),
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Message_ShowEditedStatus = settings.get('Message_ShowEditedStatus'),
	// eslint-disable-next-line @typescript-eslint/naming-convention
	API_Embed = settings.get('API_Embed'),
	// eslint-disable-next-line @typescript-eslint/naming-convention
	API_EmbedDisabledFor = settings.get('API_EmbedDisabledFor'),
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Message_GroupingPeriod = settings.get('Message_GroupingPeriod') * 1000,
}: {
	uid?: IUser['_id'] | null;
	user?: Partial<IUser>;
	rid?: IRoom['_id'];
	room?: Omit<IRoom, '_updatedAt' | 'lastMessage'>;
	subscription?: Pick<ISubscription, 'name' | 'autoTranslate' | 'rid' | 'tunread' | 'tunreadUser' | 'tunreadGroup'>;
	instance?: Blaze.TemplateInstance | ((actionId: string, context: string) => void);
	embeddedLayout?: boolean;
	translateLanguage?: unknown;
	autoImageLoad?: unknown;
	useLegacyMessageTemplate?: unknown;
	saveMobileBandwidth?: unknown;
	collapseMediaByDefault?: unknown;
	showreply?: unknown;
	showReplyButton?: unknown;
	hasPermissionDeleteMessage?: unknown;
	hasPermissionDeleteOwnMessage?: unknown;
	hideRoles?: unknown;
	UI_Use_Real_Name?: unknown;
	Chatops_Username?: unknown;
	AutoTranslate_Enabled?: unknown;
	Message_AllowEditing?: unknown;
	Message_AllowEditing_BlockEditInMinutes?: unknown;
	Message_ShowEditedStatus?: unknown;
	API_Embed?: unknown;
	API_EmbedDisabledFor?: unknown;
	Message_GroupingPeriod?: unknown;
} = {}) => {
	return {
		u: user,
		room,
		subscription,
		settings: {
			translateLanguage,
			autoImageLoad,
			useLegacyMessageTemplate,
			saveMobileBandwidth,
			collapseMediaByDefault,
			showreply,
			showReplyButton,
			hasPermissionDeleteMessage,
			hasPermissionDeleteOwnMessage,
			hideRoles,
			UI_Use_Real_Name,
			Chatops_Username,
			AutoTranslate_Enabled,
			Message_AllowEditing,
			Message_AllowEditing_BlockEditInMinutes,
			Message_ShowEditedStatus,
			API_Embed,
			API_EmbedDisabledFor,
			Message_GroupingPeriod,
		},
	} as const;
};
