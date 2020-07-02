import { Template } from 'meteor/templating';
import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../../../../client/reactAdapters';

import './DiscussionTabbar.html';

createTemplateForComponent('DiscussionMessageList', () => import('../../../../client/Channel/Discussions/ContextualBar/List'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

Template.discussionsTabbar.helpers({
	close() {
		const { data } = Template.instance();
		const { tabBar } = data;
		return () => tabBar.close();
	},
});
