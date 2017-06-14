import EventEmitter from 'wolfy87-eventemitter';
const sideNavW = 280;

window.addEventListener('resize', _.debounce((() => {
	let lastState = window.matchMedia('(min-width: 700px)').matches ? 'mini' : 'large';
	RocketChat.emit('grid', lastState);
	return () => {
		const futureState = window.matchMedia('(min-width: 700px)').matches ? 'mini' : 'large';
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
	init() {
		this.menu = $('.sidebar');
		this.mainContent = $('.main-content');

		this.list = $('.rooms-list');
		this._open = false;
		Session.set('isMenuOpen', this._open);

		this.mainContent[0].addEventListener('click', _.debounce(() => {
			this._open && this.close();
		}, 300));
	}

	isOpen() {
		return Session.get('isMenuOpen');
	}
	open() {
		this._open = true;
		Session.set('isMenuOpen', this._open);
		this.mainContent && this.mainContent.css('transform', `translateX(${ isRtl(localStorage.getItem('userLanguage'))?'-':'' }${ this.sideNavW }px)`);
		setTimeout(() => this.emit('open'), 10);
	}

	close() {
		this._open = false;
		Session.set('isMenuOpen', this._open);
		this.mainContent && this.mainContent .css('transform', 'translateX(0)');
		setTimeout(() => this.emit('close'), 10);
	}

	toggle() {
		return this.isOpen() ? this.close() : this.open();
	}
};

this.menu.on('close', function() {
	this.menu.find('[data-popover="anchor"]:checked').prop('checked', false);
});

RocketChat.on('grid', () => {
	this.menu.close();
});
