import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../../reactAdapters';

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

createTemplateForComponent('OTR', () => import('./contextualBar/OTR'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('CallJitsi', () => import('./contextualBar/Call/Jitsi'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

// createTemplateForComponent('CallBbb', () => import('./Call/Bbb'), {
// 	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
// });
