import _ from 'underscore';

this.AccountBox = (function() {
	let status = 0;
	const self = {};
	const items = new ReactiveVar([]);
	function setStatus(status) {
		return Meteor.call('UserPresence:setDefaultStatus', status);
	}
	function open() {
		if (SideNav.flexStatus()) {
			SideNav.closeFlex();
			return;
		}
		status = 1;
		self.options.removeClass('animated-hidden');
		self.box.addClass('active');
		return SideNav.toggleArrow(1);
	}
	function close() {
		status = 0;
		self.options.addClass('animated-hidden');
		self.box.removeClass('active');
		return SideNav.toggleArrow(-1);
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
		self.options.addClass('animated-hidden');
		return self.box.removeClass('active');
	}
	function init() {
		self.box = $('.account-box');
		return self.options = self.box.find('.options');
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
		init,
		addRoute,
		addItem,
		getItems
	};
}());
