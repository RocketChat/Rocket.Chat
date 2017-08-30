/* globals popover */

this.popover = {
	close() {
		document.querySelectorAll('[data-popover="anchor"]:checked').forEach((checkbox) => {
			checkbox.checked = false;
		});
	}
};

function preventDefault(e) {
	e = e || window.event;
	if (e.preventDefault) {
		e.preventDefault();
	}
	e.returnValue = false;
}

function enableWindowScroll() {
	if (window.removeEventListener) {
		window.removeEventListener('DOMMouseScroll', preventDefault, false);
	}
	window.onmousewheel = document.onmousewheel = null;
	window.onwheel = null;
}

function disableWindowScroll() {
	if (window.addEventListener) {
		window.addEventListener('DOMMouseScroll', preventDefault, false);
	}
	window.onwheel = preventDefault;
}

$(document).on('click', function(e) {
	const element = $(e.target);
	if ($(element).parents('.message').length) {
		if ($(element).data('popover') === 'label' || $(element).data('popover') === 'anchor') {
			disableWindowScroll();

			$(element).parents('.message').addClass('active');

			const popover = $(element).siblings('.rc-popover');
			const popoverContent = popover.children('.rc-popover__content');
			setTimeout(function() {
				const popoverWidth = popoverContent.outerWidth();
				const popoverHeight = popoverContent.outerHeight();
				const popoverHeightHalf = popoverContent.outerHeight() / 2;
				const pointer = $(e.target).offset().top - $('.messages-container header').outerHeight();
				const roomHeight = $('.messages-box').outerHeight();

				let top;
				if (pointer + popoverHeightHalf > roomHeight) {
					top = popoverHeight - (roomHeight - pointer);
				} else if (popoverHeightHalf < pointer) {
					top = popoverHeightHalf;
				} else {
					top = pointer - 10;
				}

				popover.css({
					top: -top,
					right: popoverWidth + 30
				});
			}, 100);
		} else if ($(element).hasClass('rc-popover__wrapper') || $(element).hasClass('rc-popover__item-text') || $(element).hasClass('rc-popover__icon-element')) {
			enableWindowScroll();
			$(element).parents('.message').removeClass('active');
			popover.close();
		}
	}
});
