import { Template } from 'meteor/templating';
import { HTML } from 'meteor/htmljs';

import './userInfo.html';
import { createTemplateForComponent } from '../../../../client/reactAdapters';

createTemplateForComponent('UserInfoWithData', () => import('../../../../client/channel/UserInfo'), {
	// eslint-disable-next-line new-cap
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar', style: 'flex-grow: 1;' }),
});

Template.userInfo.helpers({
	onClose() {
		const instance = Template.instance();
		return () => {
			instance.clear();
		};
	},
	username() {
		return Template.currentData().username;
	},
});

Template.userInfo.onCreated(function() {
	this.tabBar = Template.currentData().tabBar;
	this.autorun(() => {
		const data = Template.currentData();
		if (data.clear != null) {
			this.clear = data.clear;
		}
	});
});
