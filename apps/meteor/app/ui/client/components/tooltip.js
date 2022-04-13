import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';

import './tooltip.html';
import './tooltip.css';

let initiated = false;

const init = () => {
	if (initiated) {
		return;
	}
	initiated = true;

	Blaze.render(Template.tooltip, document.body);
};

let source = null;
let opened = false;
let timeout = null;

const placeTip = () => {
	const arrowSize = 6;
	const sourceWidth = $(source).outerWidth();
	const sourceHeight = $(source).outerHeight();
	let { left, top } = $(source).offset();

	const tip = $('.tooltip');
	const tipWidth = tip.outerWidth();
	const tipHeight = tip.outerHeight();

	left = left + sourceWidth / 2 - tipWidth / 2;

	$('.tooltip-arrow', tip).css({
		'margin-left': left < 0 ? `${left - arrowSize}px` : '',
	});

	if (left < 0) {
		left = 0;
	}

	top = top - tipHeight - arrowSize;

	tip.toggleClass('below', top < 0);

	if (top < 0) {
		top = top + sourceHeight + arrowSize;
	}

	return tip.css({
		left: `${left}px`,
		top: `${top}px`,
	});
};

const showElement = (element, sourceElement) => {
	if (opened) {
		return;
	}

	if (timeout) {
		clearTimeout(timeout);
	}

	const elementClone = $(element).clone();

	timeout = setTimeout(() => {
		timeout = null;
		source = sourceElement;

		$('.tooltip .content').empty().append(elementClone.show());
		placeTip().addClass('show');

		opened = true;
	}, 300);
};

const hide = () => {
	if (timeout) {
		clearTimeout(timeout);
	}

	if (opened) {
		$('.tooltip').removeClass('show');
		$('.tooltip .content').empty();
		opened = false;
	}
};

export const tooltip = {
	init,
	showElement,
	hide,
};
