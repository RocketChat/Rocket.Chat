import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';

import { Subscriptions, Rooms, Users } from '../../../models/client';
import { hasPermission } from '../../../authorization/client';
import { settings } from '../../../settings/client';
import { getUserPreference } from '../../../utils/client';
import { AutoTranslate } from '../../../autotranslate/client';
import { fireGlobalEvent } from '../../../../client/lib/utils/fireGlobalEvent';
import { actionLinks } from '../../../action-links/client';
import { goToRoomById } from '../../../../client/lib/utils/goToRoomById';
import { isLayoutEmbedded } from '../../../../client/lib/utils/isLayoutEmbedded';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
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
	instance = Template.instance(),
	embeddedLayout = isLayoutEmbedded(),
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
}) => {
	const openThread = (event: Event) => {
		const { rid, mid, tmid } = (event.currentTarget as HTMLElement | null)?.dataset ?? {};
		if (!rid) {
			throw new Error('Missing rid');
		}

		const context = tmid || mid;

		if (!context) {
			throw new Error('Missing mid');
		}

		const room = Rooms.findOne({ _id: rid });
		FlowRouter.go(
			FlowRouter.getRouteName(),
			{
				rid,
				name: room.name,
				tab: 'thread',
				context,
			},
			!!tmid && !!mid && tmid !== mid
				? {
						jump: mid,
				  }
				: {},
		);
		event.preventDefault();
		event.stopPropagation();
	};

	const runAction = embeddedLayout
		? (msg: IMessage, actionlink: string) =>
				fireGlobalEvent('click-action-link', {
					actionlink,
					value: msg._id,
					message: msg,
				})
		: (msg: IMessage, actionlink: string) => actionLinks.run(actionlink, msg, instance);

	const openDiscussion = (event: Event) => {
		event.preventDefault();
		event.stopPropagation();
		const { drid } = (event.currentTarget as HTMLElement | null)?.dataset ?? {};
		if (!drid) {
			throw new Error('Missing drid');
		}
		goToRoomById(drid);
	};

	const replyBroadcast = (event: Event) => {
		const { username, mid } = (event.currentTarget as HTMLElement | null)?.dataset ?? {};
		if (!mid) {
			throw new Error('Missing mid');
		}
		roomCoordinator.openRouteLink('d', { name: username }, { ...FlowRouter.current().queryParams, reply: mid });
	};

	return {
		u: user,
		room,
		subscription,
		actions: {
			openThread() {
				return openThread;
			},
			runAction(msg: IMessage) {
				return () => (actionlink: string) => (event: Event) => {
					event.preventDefault();
					event.stopPropagation();
					runAction(msg, actionlink);
				};
			},
			openDiscussion() {
				return openDiscussion;
			},
			replyBroadcast() {
				return replyBroadcast;
			},
		},
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

export function messageContext({ rid }: { rid?: IRoom['_id'] } = {}) {
	return createMessageContext({ rid });
}
