import { Template } from 'meteor/templating';
import { isMobile } from 'react-device-detect';

import { fireGlobalEvent } from '../../../../../client/lib/utils/fireGlobalEvent';
import TopBar from '../../../../../client/topbar/TopBar';
import BottomBar from '../../../../../client/components/BottomBar';

import './header.html';

Template.header.helpers({
	back() {
		return Template.instance().data.back;
	},
	buttons() {
		console.log('asdasd');
	},
	TopBar() {
		if (!isMobile) {
			return null;
		}
		return TopBar;
	},
	BottomBar() {
		if (!isMobile) {
			return null;
		}
		return BottomBar;
	},
});

Template.header.events({
	'click .iframe-toolbar .js-iframe-action'(e) {
		fireGlobalEvent('click-toolbar-button', { id: this.id });
		e.currentTarget.querySelector('button').blur();
		return false;
	},
});
