import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import _ from 'underscore';

import { appLayout } from '../../../../client/lib/appLayout';
import { SideNav } from './SideNav';

export const AccountBox = (function () {
	let status = 0;
	const items = new ReactiveVar([]);
	function setStatus(status, statusText) {
		return Meteor.call('setUserStatus', status, statusText);
	}
	function open() {
		if (SideNav.flexStatus()) {
			SideNav.closeFlex();
			return;
		}
		status = 1;
	}
	function close() {
		status = 0;
	}
	function toggle() {
		if (status) {
			return close();
		}
		return open();
	}
	function openFlex() {
		status = 0;
	}

	/*
	 * @param newOption:
	 *   name: Button label
	 *   icon: Button icon
	 *   class: Class of the item
	 *   permissions: Which permissions a user should have (all of them) to see this item
	 */
	function addItem(newItem) {
		return Tracker.nonreactive(function () {
			const actual = items.get();
			actual.push(newItem);
			return items.set(actual);
		});
	}
	function checkCondition(item) {
		return item.condition == null || item.condition();
	}
	function getItems() {
		return _.filter(items.get(), function (item) {
			if (checkCondition(item)) {
				return true;
			}
		});
	}
	function addRoute(newRoute, router, wait = () => {}) {
		if (router == null) {
			router = FlowRouter;
		}
		const container = newRoute.customContainer ? 'pageCustomContainer' : 'pageContainer';
		const routeConfig = {
			center: container,
			pageTemplate: newRoute.pageTemplate,
		};
		if (newRoute.i18nPageTitle != null) {
			routeConfig.i18nPageTitle = newRoute.i18nPageTitle;
		}
		if (newRoute.pageTitle != null) {
			routeConfig.pageTitle = newRoute.pageTitle;
		}
		return router.route(newRoute.path, {
			name: newRoute.name,
			async action() {
				await wait();
				Session.set('openedRoom');
				appLayout.renderMainLayout(routeConfig);
			},
			triggersEnter: [
				function () {
					if (newRoute.sideNav != null) {
						SideNav.setFlex(newRoute.sideNav);
						SideNav.openFlex();
					}
				},
			],
		});
	}
	return {
		setStatus,
		toggle,
		open,
		close,
		openFlex,
		addRoute,
		addItem,
		getItems,
	};
})();
