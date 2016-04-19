/* globals Blaze, RocketChat */
RocketChat.tooltip = {
	source: null,
	initiated: false,
	opened: false,
	init() {
		if (this.initiated) {
			return;
		}
		this.initiated = true;

		Blaze.render(Template.rocketchatTooltip, document.body);
	},
	showElement(element, source) {
		if (this.opened) {
			return;
		}

		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		this.timeout = setTimeout(() => {
			this.timeout = null;
			this.source = source;

			$('.tooltip').empty().append($(element).clone().show());

			this.setPosition().addClass('show');

			this.opened = true;
		}, 300);

	},
	hide() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		if (this.opened) {
			$('.tooltip').removeClass('show').empty();
			this.opened = false;
		}
	},
	setPosition() {
		let sourcePos = $(this.source).offset();

		let sourceWidth = $(this.source).outerWidth();

		const tip = $('.tooltip');

		let top = sourcePos.top - tip.outerHeight() - 5;
		let left = sourcePos.left;

		left = left + (sourceWidth / 2) - (tip.outerWidth() / 2);

		if (left < 0) {
			left = 0;
		}

		if (top < 0) {
			top = sourcePos.top + $(this.source).outerHeight() + 5;
			tip.addClass('bellow');
		} else {
			tip.removeClass('bellow');
		}

		return tip
			.css({
				top: top + 'px',
				left: left + 'px'
			});
	}
};
