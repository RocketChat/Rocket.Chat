import './ReactionList.html';

import { HTML } from 'meteor/htmljs';
import { Template } from 'meteor/templating';


import { createTemplateForComponent } from '../../../../client/reactAdapters';

// createTemplateForComponent('reactionListContent', () => import('./reactionListContent'));

Template.ReactionList.helpers({
	reactionData() {
		const instance = Template.instance();

		return instance.data;
	},
});

createTemplateForComponent(
	'ReactionListContent',
	() => import('./reactionListContent'),
	{
		// eslint-disable-next-line new-cap
		renderContainerView: () => HTML.DIV({ class: 'reaction-list' }),
	},
);
