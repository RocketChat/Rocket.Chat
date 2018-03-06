import _ from 'underscore';

this.AccountBox = (function() {
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
		} else {
			return open();
		}
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
		return Tracker.nonreactive(function() {
			const actual = items.get();
			actual.push(newItem);
			return items.set(actual);
		});
	}
	function checkCondition(item) {
		return (item.condition == null) || item.condition();
	}
	function getItems() {
		return _.filter(items.get(), function(item) {
			if (checkCondition(item)) {
				return true;
			}
		});
	}
	function addRoute(newRoute, router) {
		if (router == null) {
			router = FlowRouter;
		}
		const routeConfig = {
			center: 'pageContainer',
			pageTemplate: newRoute.pageTemplate
		};
		if (newRoute.i18nPageTitle != null) {
			routeConfig.i18nPageTitle = newRoute.i18nPageTitle;
		}
		if (newRoute.pageTitle != null) {
			routeConfig.pageTitle = newRoute.pageTitle;
		}
		return router.route(newRoute.path, {
			name: newRoute.name,
			action() {
				Session.set('openedRoom');
				return BlazeLayout.render('main', routeConfig);
			},
			triggersEnter: [
				function() {
					if (newRoute.sideNav != null) {
						SideNav.setFlex(newRoute.sideNav);
						return SideNav.openFlex();
					}
				}
			]
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
		getItems
	};
}());
