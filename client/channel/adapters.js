import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../reactAdapters';

createTemplateForComponent('Header', () => import('./Header'), {
	renderContainerView: () => HTML.DIV(), // eslint-disable-line new-cap
});

createTemplateForComponent('Burger', () => import('./Header/Burger'), {
	renderContainerView: () => HTML.DIV(), // eslint-disable-line new-cap
});

createTemplateForComponent('DiscussionMessageList', () => import('./Discussions/ContextualBar/List'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('ThreadsList', () => import('./Threads/ContextualBar/List'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('ExportMessages', () => import('./ExportMessages'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});
