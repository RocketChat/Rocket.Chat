import _ from 'underscore';

const replaceWhitespaces = (whitespaces) => `${ '&nbsp;'.repeat(whitespaces.length - 1) } `;

const getShadow = () => {
	let shadow = document.getElementById('autogrow-shadow');

	if (!shadow) {
		shadow = document.createElement('div');
		shadow.setAttribute('id', 'autogrow-shadow');
		document.body.appendChild(shadow);
	}

	return shadow;
};

$.fn.autogrow = function({ postGrowCallback } = {}) {
	const shadow = getShadow();

	return this.filter('textarea').each((i, textarea) => {
		const $textarea = $(textarea);

		const trigger = _.debounce(() => $textarea.trigger('autogrow', []), 500);

		const width = $textarea.width();
		const minHeight = $textarea.height();
		const maxHeight = window.getComputedStyle(textarea)['max-height'].replace('px', '');

		let lastWidth = width;
		let lastHeight = minHeight;
		let length = 0;

		shadow.style.position = 'absolute';
		shadow.style.top = '-10000px';
		shadow.style.left = '-10000px';
		shadow.style.width = `${ width }px`;
		shadow.style.fontSize = $textarea.css('fontSize');
		shadow.style.fontFamily = $textarea.css('fontFamily');
		shadow.style.fontWeight = $textarea.css('fontWeight');
		shadow.style.lineHeight = `${ $textarea.css('lineHeight') }px`;
		shadow.style.resize = 'none';
		shadow.style.wordWrap = 'break-word';

		const update = (event) => {
			const width = $textarea.width();
			if (lastHeight >= maxHeight && length && length < textarea.value.length && width === lastWidth) {
				return true;
			}

			let val = textarea.value.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/&/g, '&amp;')
				.replace(/\n$/, '<br/>&nbsp;')
				.replace(/\n/g, '<br/>')
				.replace(/ {2,}/g, replaceWhitespaces);

			// Did enter get pressed?  Resize in this keydown event so that the flicker doesn't occur.
			if (event && event.data && event.data.event === 'keydown' && event.keyCode === 13 && (event.shiftKey || event.ctrlKey || event.altKey)) {
				val += '<br/>';
			}

			if (width !== lastWidth) {
				shadow.style.width = `${ width }px`;
				lastWidth = width;
			}

			shadow.innerHTML = val;

			let newHeight = Math.max(shadow.clientHeight + 1, minHeight) + 1;

			let overflow = 'hidden';

			if (newHeight >= maxHeight) {
				newHeight = maxHeight;
				overflow = '';
			} else {
				length = textarea.value.length;
			}

			if (newHeight === lastHeight) {
				return true;
			}

			lastHeight = newHeight;

			$textarea.css({ overflow, height: newHeight });

			trigger();

			postGrowCallback && postGrowCallback($textarea);
		};

		const updateThrottled = _.throttle(update, 300);

		$textarea.on('change input', updateThrottled);
		$textarea.on('focus', update);
		$(window).resize(updateThrottled);
		update();
		textarea.updateAutogrow = update;
	});
};
