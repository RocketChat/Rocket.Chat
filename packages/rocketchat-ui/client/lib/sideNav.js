this.SideNav = new class {
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
			setTimeout(() => {
				return this.flexNav.removeClass('animated-hidden');
			}, 50);
		}
		return setTimeout(() => {
			this.animating = false;
			return typeof callback === 'function' && callback();
		}, 500);
	}
	closeFlex(callback = null) {
		let subscription;
		if (!RocketChat.roomTypes.getTypes().filter(function(i) {
			return i.route;
		}).map(function(i) {
			return i.route.name;
		}).includes(FlowRouter.current().route.name)) {
			subscription = RocketChat.models.Subscriptions.findOne({
				rid: Session.get('openedRoom')
			});
			if (subscription != null) {
				RocketChat.roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
			} else {
				FlowRouter.go('home');
			}
		}
		if (this.animating === true) {
			return;
		}
		return this.toggleFlex(-1, callback);
	}
	flexStatus() {
		return this.flexNav.opened;
	}
	setFlex(template, data) {
		if (data == null) {
			data = {};
		}
		Session.set('flex-nav-template', template);
		return Session.set('flex-nav-data', data);
	}
	getFlex() {
		return {
			template: Session.get('flex-nav-template'),
			data: Session.get('flex-nav-data')
		};
	}

	toggleCurrent() {
		if (this.flexNav && this.flexNav.opened) {
			return this.closeFlex();
		} else {
			return AccountBox.toggle();
		}
	}
	focusInput() {
		const sideNavDivs = [...this.sideNav[0].children].filter(el => {
			return el.tagName === 'DIV' && !el.classList.contains('hidden');
		});
		let highestZidx = 0;
		let highestZidxElem;
		sideNavDivs.forEach(el => {
			const zIndex = Number(window.getComputedStyle(el).zIndex);
			if (zIndex > highestZidx) {
				highestZidx = zIndex;
				highestZidxElem = el;
			}
		});
		setTimeout(() => {
			const ref = highestZidxElem.querySelector('input');
			return ref && ref.focus();
		}, 200);
	}
	validate() {
		const invalid = [];
		this.sideNav.find('input.required').each(function() {
			if (!this.value.length) {
				return invalid.push($(this).prev('label').html());
			}
		});
		if (invalid.length) {
			return invalid;
		}
		return false;
	}

	openFlex(callback) {
		if (!this.initiated) {
			return this.openQueue.push({
				config: this.getFlex(),
				callback
			});
		}
		if (this.animating === true) {
			return;
		}
		AccountBox.close();
		this.toggleFlex(1, callback);
		return this.focusInput();
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
			return this.openQueue = [];
		}
	}
};
