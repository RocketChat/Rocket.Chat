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
	showElement(source, element) {
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

		let top = sourcePos.top - $('.tooltip').outerHeight() - 5;
		let left = sourcePos.left;

		left = left + (sourceWidth / 2) - ($('.tooltip').outerWidth() / 2);

		if (left < 0) {
			left = 0;
		}
		return $('.tooltip')
			.css({
				top: top + 'px',
				left: left + 'px'
			});
	},
};
