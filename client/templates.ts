import { HTML } from 'meteor/htmljs';
import { ComponentType } from 'react';

import { createTemplateForComponent } from './lib/portals/createTemplateForComponent';

createTemplateForComponent('MessageActions', () => import('./components/Message/Actions'));

createTemplateForComponent('reactAttachments', () => import('./components/Message/Attachments'));

createTemplateForComponent('ThreadMetric', () => import('./components/Message/Metrics/Thread'));

createTemplateForComponent(
	'DiscussionMetric',
	() => import('./components/Message/Metrics/Discussion'),
);

createTemplateForComponent(
	'BroadCastMetric',
	() => import('./components/Message/Metrics/Broadcast'),
);

createTemplateForComponent(
	'Checkbox',
	(): Promise<{ default: ComponentType<import('@rocket.chat/fuselage').CheckBoxProps> }> =>
		import('@rocket.chat/fuselage').then(({ CheckBox }) => ({ default: CheckBox })),
	{
		renderContainerView: () => HTML.DIV({ class: 'rcx-checkbox', style: 'display: flex;' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent(
	'ThreadComponent',
	() => import('../app/threads/client/components/ThreadComponent'),
	{
		renderContainerView: () =>
			HTML.DIV({ class: 'contextual-bar', style: 'display: flex; height: 100%;' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent('RoomForeword', () => import('./components/RoomForeword'));

createTemplateForComponent(
	'accountSecurity',
	() => import('./views/account/security/AccountSecurityPage'),
);

createTemplateForComponent('messageLocation', () => import('./views/location/MessageLocation'));

createTemplateForComponent('sidebarHeader', () => import('./sidebar/header'));

createTemplateForComponent('sidebarChats', () => import('./sidebar/RoomList'), {
	renderContainerView: () => HTML.DIV({ style: 'display: flex; flex: 1 1 auto;' }), // eslint-disable-line new-cap
});

createTemplateForComponent(
	'reactionList',
	() => import('../app/ui-utils/client/lib/ReactionListContent'),
	{
		renderContainerView: () =>
			// eslint-disable-next-line new-cap
			HTML.DIV({
				style:
					'margin: -16px; height: 100%; display: flex; flex-direction: column; overflow: hidden;',
			}),
	},
);

createTemplateForComponent(
	'omnichannelFlex',
	() => import('./views/omnichannel/sidebar/OmnichannelSidebar'),
	{
		renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent('auditPage', () => import('../ee/client/audit/AuditPage'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%;' }), // eslint-disable-line new-cap
});

createTemplateForComponent('auditLogPage', () => import('../ee/client/audit/AuditLogPage'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%;' }), // eslint-disable-line new-cap
});

createTemplateForComponent(
	'DiscussionMessageList',
	() => import('./views/room/contextualBar/Discussions'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent('ThreadsList', () => import('./views/room/contextualBar/Threads'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent(
	'ExportMessages',
	() => import('./views/room/contextualBar/ExportMessages'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent(
	'KeyboardShortcuts',
	() => import('./views/room/contextualBar/KeyboardShortcuts'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent('room', () => import('./views/room/Room'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }), // eslint-disable-line new-cap
});

createTemplateForComponent(
	'AutoTranslate',
	() => import('./views/room/contextualBar/AutoTranslate'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent(
	'NotificationsPreferences',
	() => import('./views/room/contextualBar/NotificationPreferences'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent(
	'InviteUsers',
	() => import('./views/room/contextualBar/RoomMembers/InviteUsers'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent(
	'EditInvite',
	() => import('./views/room/contextualBar/RoomMembers/EditInvite'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent(
	'AddUsers',
	() => import('./views/room/contextualBar/RoomMembers/AddUsers'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent('membersList', () => import('./views/room/contextualBar/RoomMembers'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('OTR', () => import('./views/room/contextualBar/OTR'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent(
	'EditRoomInfo',
	() => import('./views/room/contextualBar/Info/EditRoomInfo'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent('RoomInfo', () => import('./views/room/contextualBar/Info/RoomInfo'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent(
	'UserInfoWithData',
	() => import('./views/room/contextualBar/UserInfo'),
	{
		// eslint-disable-next-line new-cap
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent(
	'channelFilesList',
	() => import('./views/room/contextualBar/RoomFiles/RoomFiles'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent('RoomAnnouncement', () => import('./views/room/Announcement'), {
	renderContainerView: () => HTML.DIV(), // eslint-disable-line new-cap
});

createTemplateForComponent(
	'PruneMessages',
	() => import('./views/room/contextualBar/PruneMessages'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
	},
);

createTemplateForComponent('Burger', () => import('./views/room/Header/Burger'), {
	renderContainerView: () => HTML.DIV(), // eslint-disable-line new-cap
});

createTemplateForComponent(
	'resetPassword',
	() => import('./views/login/ResetPassword/ResetPassword'),
	{
		// eslint-disable-next-line new-cap
		renderContainerView: () => HTML.DIV({ style: 'display: flex;' }),
	},
);

createTemplateForComponent('ModalBlock', () => import('./views/blocks/ModalBlock'), {
	// eslint-disable-next-line new-cap
	renderContainerView: () => HTML.DIV({ style: 'display: flex; width: 100%; height: 100%;' }),
});

createTemplateForComponent('Blocks', () => import('./views/blocks/MessageBlock'));

createTemplateForComponent('adminFlex', () => import('./views/admin/sidebar/AdminSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }), // eslint-disable-line new-cap
});

createTemplateForComponent('accountFlex', () => import('./views/account/AccountSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }), // eslint-disable-line new-cap
});

createTemplateForComponent('SortList', () => import('./components/SortList'));

createTemplateForComponent(
	'CreateRoomList',
	() => import('./sidebar/header/actions/CreateRoomList'),
);

createTemplateForComponent('UserDropdown', () => import('./sidebar/header/UserDropdown'));
