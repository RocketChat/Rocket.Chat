import { Template } from 'meteor/templating';
import {isMobile} from 'react-device-detect'

import { fireGlobalEvent } from '../../../../../client/lib/utils/fireGlobalEvent';
import HomeButton from '../../../../../client/components/HomeButton/HomeButton';
import BlogButton from '../../../../../client/components/BlogButton/BlogButton';
import GameButton from '../../../../../client/components/GameButton/GameButton';
import ProductButton from '../../../../../client/components/ProductButton/ProductButton';
import MessagesButton from '../../../../../client/components/MessagesButton/MessagesButton';
import TopBar from '../../../../../client/topbar/TopBar';

import './header.html';

Template.header.helpers({
	back() {
		return Template.instance().data.back;
	},
	buttons() {
		console.log('asdasd');
	},
	HomeButton() {
		if (!isMobile) {
			return null
		}
		return HomeButton;
	},
	BlogButton() {
		if (!isMobile) {
			return null
		}
		return BlogButton;
	},
	GameButton() {
		if (!isMobile) {
			return null
		}
		return GameButton;
	},
	ProductButton() {
		if (!isMobile) {
			return null
		}
		return ProductButton;
	},
	MessagesButton() {
		if (!isMobile) {
			return null
		}
		return MessagesButton;
	},
	TopBar() {
		if (!isMobile) {
			return null
		}
		return TopBar;
	},
});

Template.header.events({
	'click .iframe-toolbar .js-iframe-action'(e) {
		fireGlobalEvent('click-toolbar-button', { id: this.id });
		e.currentTarget.querySelector('button').blur();
		return false;
	},
});
