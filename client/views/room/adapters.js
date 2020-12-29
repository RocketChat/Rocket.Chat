import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../../reactAdapters';

// createTemplateForComponent('Header', () => import('../views/room/Header'), {
// 	renderContainerView: () => HTML.DIV(), // eslint-disable-line new-cap
// });

createTemplateForComponent('Burger', () => import('../views/room/Header/Burger'), {
	renderContainerView: () => HTML.DIV(), // eslint-disable-line new-cap
});

// createTemplateForComponent('DiscussionMessageList', () => import('./Discussions/ContextualBar/List'), {
// 	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
// });

// createTemplateForComponent('ThreadsList', () => import('./Threads/ContextualBar/List'), {
// 	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
// });

// createTemplateForComponent('ExportMessages', () => import('./ExportMessages'), {
// 	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
// });

// createTemplateForComponent('KeyboardShortcuts', () => import('./KeyboardShortcuts'), {
// 	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
// });
createTemplateForComponent('DiscussionMessageList', () => import('./contextualBar/Discussions'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('ThreadsList', () => import('./contextualBar/Threads'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('ExportMessages', () => import('./contextualBar/ExportMessages'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('KeyboardShortcuts', () => import('./contextualBar/KeyboardShortcuts'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('room', () => import('.'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }), // eslint-disable-line new-cap
});

createTemplateForComponent('AutoTranslate', () => import('./contextualBar/AutoTranslate'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('NotificationsPreferences', () => import('./contextualBar/NotificationPreferences'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('InviteUsers', () => import('./contextualBar/RoomMembers/InviteUsers'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('EditInvite', () => import('./contextualBar/RoomMembers/EditInvite'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('AddUsers', () => import('./contextualBar/RoomMembers/AddUsers'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('membersList', () => import('./contextualBar/RoomMembers'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('OTR', () => import('./contextualBar/OTR'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('EditRoomInfo', () => import('./contextualBar/Info/EditRoomInfo'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('RoomInfo', () => import('./contextualBar/Info/RoomInfo'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('UserInfoWithData', () => import('./contextualBar/UserInfo'), {
	// eslint-disable-next-line new-cap
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
});

createTemplateForComponent('channelFilesList', () => import('./contextualBar/RoomFiles/RoomFiles'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});
