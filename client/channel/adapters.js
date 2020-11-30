import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../reactAdapters';

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

createTemplateForComponent('room', () => import('../views/room'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }), // eslint-disable-line new-cap
});

createTemplateForComponent('AutoTranslate', () => import('./AutoTranslate'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('InviteUsers', () => import('../views/room/RoomMembers/InviteUsers'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('EditInvite', () => import('../views/room/RoomMembers/EditInvite'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('OTR', () => import('../views/room/ContextualBar/OTR'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});
