import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';

import { AccountBox } from './AccountBox';
import { Subscriptions } from '../../../models';
import { RoomManager } from '../../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

export const SideNav = new (class {
	constructor() {
		this.initiated = false;
		this.sideNav = {};
		this.flexNav = {};
		this.animating = false;
		this.openQueue = [];
	}

	toggleFlex(status, callback) {
		if (this.animating === true) {
			return;
		}
		this.animating = true;
		if (status === -1 || (status !== 1 && this.flexNav.opened)) {
			this.flexNav.opened = false;
			this.flexNav.addClass('animated-hidden');
		} else {
			this.flexNav.opened = true;
			if (window.DISABLE_ANIMATION === true) {
				this.flexNav.removeClass('animated-hidden');
			} else {
				setTimeout(() => this.flexNav.removeClass('animated-hidden'), 50);
			}
		}

		if (window.DISABLE_ANIMATION === true) {
			!this.flexNav.opened && this.setFlex();
			this.animating = false;
			return typeof callback === 'function' && callback();
		}

		return setTimeout(() => {
			!this.flexNav.opened && this.setFlex();
			this.animating = false;
			return typeof callback === 'function' && callback();
		}, 500);
	}

	closeFlex(callback = null) {
		if (!roomCoordinator.isRouteNameKnown(FlowRouter.current().route.name)) {
			const subscription = Subscriptions.findOne({ rid: RoomManager.lastRid });
			if (subscription) {
				roomCoordinator.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
			} else {
				FlowRouter.go('home');
			}
		}
		if (this.animating === true) {
			return;
		}
		this.toggleFlex(-1, callback);
	}

	flexStatus() {
		return this.flexNav.opened;
	}

	setFlex(template, data = {}) {
		Session.set('flex-nav-template', template);
		return Session.set('flex-nav-data', data);
	}

	getFlex() {
		return {
			template: Session.get('flex-nav-template'),
			data: Session.get('flex-nav-data'),
		};
	}

	toggleCurrent() {
		if (this.flexNav && this.flexNav.opened) {
			return this.closeFlex();
		}
		return AccountBox.toggle();
	}

	validate() {
		const invalid = [];
		this.sideNav.find('input.required').each(function () {
			if (!this.value.length) {
				return invalid.push($(this).prev('label').html());
			}
		});
		if (invalid.length) {
			return invalid;
		}
		return false;
	}

	openFlex(callback = () => {}) {
		if (!this.initiated) {
			return this.openQueue.push({
				config: this.getFlex(),
				callback,
			});
		}
		if (this.animating === true) {
			return;
		}
		this.toggleFlex(1, callback);
	}

	init() {
		this.sideNav = $('.sidebar');
		this.flexNav = this.sideNav.find('.flex-nav');
		this.setFlex('');
		this.initiated = true;
		if (this.openQueue.length > 0) {
			this.openQueue.forEach((item) => {
				this.setFlex(item.config.template, item.config.data);
				return this.openFlex(item.callback);
			});
			this.openQueue = [];
		}
	}
})();
