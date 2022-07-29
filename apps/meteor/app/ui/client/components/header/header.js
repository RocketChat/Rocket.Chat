import { Template } from 'meteor/templating';

import { fireGlobalEvent } from '../../../../../client/lib/utils/fireGlobalEvent';

import './header.html';

Template.header.helpers({
	back() {
		return Template.instance().data.back;
	},
	buttons() {
		console.log('asdasd');
	},
});

Template.header.events({
	'click .iframe-toolbar .js-iframe-action'(e) {
		fireGlobalEvent('click-toolbar-button', { id: this.id });
		e.currentTarget.querySelector('button').blur();
		return false;
	},
});
