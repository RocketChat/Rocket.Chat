import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Emitter } from '@rocket.chat/emitter';

import { isRtl } from '../../../utils';

const sideNavW = 280;
const map = (x, in_min, in_max, out_min, out_max) => ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;

export const menu = new (class extends Emitter {
	constructor() {
		super();
		this._open = false;

		this.sideNavW = sideNavW;
	}

	get isRtl() {
		return isRtl(Meteor._localStorage.getItem('userLanguage'));
	}

	translate(diff, width = sideNavW) {
		if (diff === undefined) {
			diff = this.isRtl ? -1 * sideNavW : sideNavW;
		}
		this.sidebarWrap.css('width', '100%');
		this.wrapper.css('overflow', 'hidden');
		this.sidebarWrap.css('background-color', '#000');
		this.sidebarWrap.css('opacity', map(Math.abs(diff) / width, 0, 1, -0.1, 0.8).toFixed(2));
		this.isRtl
			? this.sidebar.css('transform', `translate3d(${(sideNavW + diff).toFixed(3)}px, 0 , 0)`)
			: this.sidebar.css('transform', `translate3d(${(diff - sideNavW).toFixed(3)}px, 0 , 0)`);
	}

	init() {
		this.menu = $('.sidebar');
		this.sidebar = this.menu;
		this.sidebarWrap = $('.sidebar-wrap');
		this.wrapper = $('.messages-box > .wrapper');
		const ignore = (fn) => (event) => document.body.clientWidth <= 780 && fn(event);

		this.sidebarWrap.on(
			'click',
			ignore((e) => {
				e.target === this.sidebarWrap[0] && this.isOpen() && this.emit('clickOut', e);
			}),
		);
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
		this.on(
			'open',
			ignore(() => {
				this.sidebar.css('box-shadow', '0 0 15px 1px rgba(0,0,0,.3)');
				// this.sidebarWrap.css('z-index', '9998');
				this.translate();
			}),
		);
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
		this.emit('change');
		this.emit('open');
	}

	close() {
		this._open = false;
		Session.set('isMenuOpen', this._open);
		this.emit('change');
		this.emit('close');
	}

	toggle() {
		return this.isOpen() ? this.close() : this.open();
	}
})();

let passClosePopover = false;

menu.on('clickOut', function () {
	if (!menu.closePopover()) {
		passClosePopover = true;
		menu.close();
	}
});

menu.on('close', function () {
	if (!menu.sidebar) {
		return;
	}

	menu.sidebar.css('transition', '');
	menu.sidebarWrap.css('transition', '');
	if (passClosePopover) {
		passClosePopover = false;
		return;
	}
	menu.closePopover();
});
