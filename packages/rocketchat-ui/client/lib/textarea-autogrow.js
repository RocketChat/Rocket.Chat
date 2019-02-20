import _ from 'underscore';
const times = function(string, number) {
	let r = '';
	for (let i = 0; i < number; i++) { r += string; }
	return r;
};

const runTimes = (space) => `${ times('&nbsp;', space.length - 1) } `;
(function($) {
	/**
	 * Auto-growing textareas; technique ripped from Facebook
	 *
	 *
	 * http://github.com/jaz303/jquery-grab-bag/tree/master/javascripts/jquery.autogrow-textarea.js
	 */
	$.fn.autogrow = function(options) {
		let shadow = $('body > #autogrow-shadow');
		if (!shadow.length) {
			shadow = $('<div id="autogrow-shadow"></div>').addClass('autogrow-shadow').appendTo(document.body);
		}
		return this.filter('textarea').each(function() {
			const self = this;
			const $self = $(self);
			const minHeight = $self.height();

			const settings = {
				postGrowCallback: null,
				...options,
			};

			const maxHeight = window.getComputedStyle(self)['max-height'].replace('px', '');

			const trigger = _.debounce(() => $self.trigger('autogrow', []), 500);
			const getWidth = (() => {
				let width = 0;
				let expired = false;
				let timer = null;
				return () => {
					if (timer) {
						clearTimeout(timer);
					}
					timer = setTimeout(function() {
						expired = true;
						timer = null;
					}, 300);
					if (!width || expired) {
						width = $self.width();
						expired = false;
					}
					return width;
				};
			})();

			const width = getWidth();
			let lastWidth = width;
			let lastHeight = minHeight;

			let length = 0;
			shadow.css({
				position: 'absolute',
				top: -10000,
				left: -10000,
				width,
				fontSize: $self.css('fontSize'),
				fontFamily: $self.css('fontFamily'),
				fontWeight: $self.css('fontWeight'),
				lineHeight: $self.css('lineHeight'),
				resize: 'none',
				wordWrap: 'break-word',
			});
			const update = function update(event) {
				const width = getWidth();
				if (lastHeight >= maxHeight && length && length < self.value.length && width === lastWidth) {
					return true;
				}

				let val = self.value.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/&/g, '&amp;')
					.replace(/\n$/, '<br/>&nbsp;')
					.replace(/\n/g, '<br/>')
					.replace(/ {2,}/g, runTimes);

				// Did enter get pressed?  Resize in this keydown event so that the flicker doesn't occur.
				if (event && event.data && event.data.event === 'keydown' && event.keyCode === 13 && (event.shiftKey || event.ctrlKey || event.altKey)) {
					val += '<br/>';
				}

				if (width !== lastWidth) {
					shadow.css('width', width);
					lastWidth = width;
				}

				shadow[0].innerHTML = val;

				let newHeight = Math.max(shadow[0].clientHeight + 1, minHeight) + 1;

				let overflow = 'hidden';

				if (newHeight >= maxHeight) {
					newHeight = maxHeight;
					overflow = '';
				} else {
					length = self.value.length;
				}

				if (newHeight === lastHeight) {
					return true;
				}

				lastHeight = newHeight;

				$self.css({ overflow, height: newHeight });

				trigger();

				if (settings.postGrowCallback !== null) {
					settings.postGrowCallback($self);
				}
			};

			const updateThrottled = _.throttle(update, 300);

			$self.on('change input', updateThrottled);
			$self.on('focus', update);
			$(window).resize(updateThrottled);
			update();
			self.updateAutogrow = updateThrottled;
		});
	};
}(jQuery));
