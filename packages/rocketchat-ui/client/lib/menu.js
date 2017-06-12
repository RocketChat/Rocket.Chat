/* globals isRtl */
const sideNavW = 280;
this.menu = new class {
	constructor() {
		this._onOpen = [];
		this._onClose = [];
		this.updateUnreadBars = _.throttle(() => {
			if (this.list == null) {
				return;
			}
			const listOffset = this.list.offset();
			const listHeight = this.list.height();
			let showTop = false;
			let showBottom = false;
			$('li.has-alert').each(function() {
				if ($(this).offset().top < listOffset.top - $(this).height()) {
					showTop = true;
				}
				if ($(this).offset().top > listOffset.top + listHeight) {
					return showBottom = true;
				}
			});
			if (showTop === true) {
				$('.top-unread-rooms').removeClass('hidden');
			} else {
				$('.top-unread-rooms').addClass('hidden');
			}
			if (showBottom === true) {
				return $('.bottom-unread-rooms').removeClass('hidden');
			} else {
				return $('.bottom-unread-rooms').addClass('hidden');
			}
		}, 200);
		this.sideNavW = sideNavW;
	}
	init() {
		this.mainContent = $('.main-content');
		this.list = $('.rooms-list');
		Session.set('isMenuOpen', false);
	}

	isOpen() {
		return Session.get('isMenuOpen');
	}
	onOpen(fn) {
		if (typeof fn === 'function') {
			this._onOpen.push(fn);
		}
	}
	onClose(fn) {
		if (typeof fn === 'function') {
			this._onClose.push(fn);
		}
	}
	open() {
		Session.set('isMenuOpen', true);
		this.mainContent && this.mainContent.css('transform', `translateX(${ isRtl(localStorage.getItem('userLanguage'))?'-':'' }${ this.sideNavW }px)`);
		setTimeout(() => this._onOpen.forEach(fn => fn.apply(this)), 10);
	}

	close() {
		Session.set('isMenuOpen', false);
		this.mainContent && this.mainContent .css('transform', 'translateX(0)');
		setTimeout(() => this._onClose.forEach(fn => fn.apply(this)), 10);
	}

	toggle() {
		return this.isOpen() ? this.close() : this.open();
	}
};
