import _ from 'underscore';
import EventEmitter from 'wolfy87-eventemitter';
const sideNavW = 280;
const map = (x, in_min, in_max, out_min, out_max) => (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;

window.addEventListener('resize', _.debounce((() => {
	let lastState = window.matchMedia('(min-width: 780px)').matches ? 'mini' : 'large';
	RocketChat.emit('grid', lastState);
	return () => {
		const futureState = window.matchMedia('(min-width: 780px)').matches ? 'mini' : 'large';
		if (lastState !== futureState) {
			lastState = futureState;
			RocketChat.emit('grid', lastState);
		}
	};
})(), 100));

/* globals isRtl */
this.menu = new class extends EventEmitter {
	constructor() {
		super();
		this._open = false;
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
	get isRtl() {
		return isRtl(localStorage.getItem('userLanguage'));
	}
	touchstart(e) {
		this.movestarted = false;
		this.blockmove = false;
		this.touchstartX = undefined;
		this.touchstartY = undefined;
		this.diff = 0;
		if (e.target === this.sidebarWrap[0] || $(e.target).closest('.main-content').length > 0) {
			this.closePopover();
			this.touchstartX = e.touches[0].clientX;
			this.touchstartY = e.touches[0].clientY;
			this.mainContent = $('.main-content');
		}
	}
	touchmove(e) {
		if (this.touchstartX == null) {
			return;
		}
		const [touch] = e.touches;
		const diffX = touch.clientX - this.touchstartX;
		const diffY = touch.clientY - this.touchstartY;
		const absX = Math.abs(diffX);
		const absY = Math.abs(diffY);

		if (!this.movestarted && absY > 5) {
			this.blockmove = true;
		}
		if (this.blockmove) {
			return;
		}
		this.sidebar.css('transition', 'none');
		this.sidebarWrap.css('transition', 'none');
		if (this.movestarted === true || absX > 5) {
			this.movestarted = true;
			if (this.isRtl) {
				if (this.isOpen()) {
					this.diff = -sideNavW + diffX;
				} else {
					this.diff = diffX;
				}
				if (this.diff < -sideNavW) {
					this.diff = -sideNavW;
				}
				if (this.diff > 0) {
					this.diff = 0;
				}
			} else {
				if (this.isOpen()) {
					this.diff = sideNavW + diffX;
				} else {
					this.diff = diffX;
				}
				if (this.diff > sideNavW) {
					this.diff = sideNavW;
				}
				if (this.diff < 0) {
					this.diff = 0;
				}
			}
			// if (map((this.diff / sideNavW), 0, 1, -.1, .8) > 0) {
			this.sidebar.css('box-shadow', '0 0 15px 1px rgba(0,0,0,.3)');
			// this.sidebarWrap.css('z-index', '9998');
			this.translate(this.diff);
			// }
		}
	}
	translate(diff, width = sideNavW) {
		if (diff === undefined) {
			diff = this.isRtl ? -1 * sideNavW : sideNavW;
		}
		this.sidebarWrap.css('width', '100%');
		this.wrapper.css('overflow', 'hidden');
		this.sidebarWrap.css('background-color', '#000');
		this.sidebarWrap.css('opacity', map((Math.abs(diff) / width), 0, 1, -.1, .8).toFixed(2));
		this.isRtl ? this.sidebar.css('transform', `translate3d(${ (sideNavW + diff).toFixed(3) }px, 0 , 0)`) : this.sidebar.css('transform', `translate3d(${ (diff - sideNavW).toFixed(3) }px, 0 , 0)`);
	}
	touchend() {
		const [max, min] = [sideNavW * .76, sideNavW * .24];
		if (this.movestarted !== true) {
			return;
		}
		this.movestarted = false;
		if (this.isRtl) {
			if (this.isOpen()) {
				return this.diff >= -max ? this.close() : this.open();
			} else if (this.diff <= -min) {
				return this.open();
			}
			return this.close();
		}
		if (this.isOpen()) {
			if (this.diff >= max) {
				return this.open();
			}
			return this.close();
		}
		if (this.diff >= min) {
			return this.open();
		}
		return this.close();
	}
	init() {
		this.sidebar = this.menu = $('.sidebar');
		this.sidebarWrap = $('.sidebar-wrap');
		this.wrapper = $('.messages-box > .wrapper');
		const ignore = (fn) => (event) => document.body.clientWidth <= 780 && fn(event);

		document.body.addEventListener('touchstart', ignore((e) => this.touchstart(e)));
		document.body.addEventListener('touchmove', ignore((e) => this.touchmove(e)));
		document.body.addEventListener('touchend', ignore((e) => this.touchend(e)));
		this.sidebarWrap.on('click', ignore((e) => {
			e.target === this.sidebarWrap[0] && this.isOpen() && this.emit('clickOut', e);
		}));
		this.on('close', () => {
			this.sidebarWrap.css('width', '');
			// this.sidebarWrap.css('z-index', '');
			this.sidebarWrap.css('background-color', '');
			this.sidebar.css('transform', '');
			this.sidebar.css('box-shadow', '');
			this.sidebar.css('transition', '');
			this.sidebarWrap.css('transition', '');
			this.wrapper && this.wrapper.css('overflow', '');
		});
		this.on('open', ignore(() => {
			this.sidebar.css('box-shadow', '0 0 15px 1px rgba(0,0,0,.3)');
			// this.sidebarWrap.css('z-index', '9998');
			this.translate();
		}));
		this.mainContent = $('.main-content');

		this.list = $('.rooms-list');
		this._open = false;
		Session.set('isMenuOpen', this._open);
	}
	closePopover() {
		return this.menu.find('[data-popover="anchor"]:checked').prop('checked', false).length > 0;
	}
	isOpen() {
		return Session.get('isMenuOpen');
	}
	open() {
		this._open = true;
		Session.set('isMenuOpen', this._open);
		this.emit('open');
	}

	close() {
		this._open = false;
		Session.set('isMenuOpen', this._open);
		this.emit('close');
	}

	toggle() {
		return this.isOpen() ? this.close() : this.open();
	}
};


let passClosePopover = false;

this.menu.on('clickOut', function() {
	if (!this.closePopover()) {
		passClosePopover = true;
		this.close();
	}
});

this.menu.on('close', function() {
	this.sidebar.css('transition', '');
	this.sidebarWrap.css('transition', '');
	if (passClosePopover) {
		passClosePopover = false;
		return;
	}
	this.closePopover();
});

RocketChat.on('grid', () => {
	this.menu.close();
});
