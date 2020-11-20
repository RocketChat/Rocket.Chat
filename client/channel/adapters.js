import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../reactAdapters';

createTemplateForComponent('DiscussionMessageList', () => import('./Discussions/ContextualBar/List'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('ThreadsList', () => import('./Threads/ContextualBar/List'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('ExportMessages', () => import('./ExportMessages'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('KeyboardShortcuts', () => import('./KeyboardShortcuts'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('room', () => import('../views/room'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }), // eslint-disable-line new-cap
});
