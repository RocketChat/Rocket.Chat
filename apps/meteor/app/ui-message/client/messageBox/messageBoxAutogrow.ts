import _ from 'underscore';

const replaceWhitespaces = (whitespaces: string) => `${'&nbsp;'.repeat(whitespaces.length - 1)} `;

export const setupAutogrow = (textarea: HTMLTextAreaElement, shadow: HTMLElement, callback: () => void) => {
	const width = textarea.clientWidth;
	const height = textarea.clientHeight;
	const { font, lineHeight, maxHeight: maxHeightPx } = window.getComputedStyle(textarea);

	shadow.style.position = 'fixed';
	shadow.style.top = '-10000px';
	shadow.style.left = '-10000px';
	shadow.style.width = `${width}px`;
	shadow.style.font = font;
	shadow.style.lineHeight = lineHeight;
	shadow.style.resize = 'none';
	shadow.style.wordWrap = 'break-word';

	const minHeight = height;
	const maxHeight = parseInt(maxHeightPx, 10);

	let lastWidth = width;
	let lastHeight = minHeight;
	let textLenght = 0;

	const update = () => {
		const { clientWidth: width, value: text } = textarea;

		const isMaximumHeightReached = lastHeight >= maxHeight;
		const isTextLengthOutdated = textLenght && textLenght < text.length;
		const wasWidthChanged = width !== lastWidth;

		if (isMaximumHeightReached && isTextLengthOutdated && !wasWidthChanged) {
			return true;
		}

		const shadowText = text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\n$/, '<br/>&nbsp;')
			.replace(/\n/g, '<br/>')
			.replace(/ {2,}/g, replaceWhitespaces);
		if (wasWidthChanged) {
			shadow.style.width = `${width}px`;
			lastWidth = width;
		}

		shadow.innerHTML = shadowText;

		const shadowHeight = Math.max(shadow.clientHeight + 1, minHeight) + 1;
		const height = Math.min(shadowHeight, maxHeight);

		if (height === lastHeight) {
			return true;
		}

		lastHeight = height;

		const overflow = height < maxHeight ? 'hidden' : '';

		if (height < maxHeight) {
			textLenght = text.length;
		}

		textarea.style.overflow = overflow;
		textarea.style.height = `${height}px`;

		callback?.();
	};

	const updateThrottled = _.throttle(update, 300);

	const $textarea = $(textarea);
	$textarea.on('focus', update);
	$textarea.on('change input', updateThrottled);
	window.addEventListener('resize', updateThrottled, false);

	const destroy = () => {
		$textarea.off('focus', update);
		$textarea.off('change input', updateThrottled);
		window.removeEventListener('resize', updateThrottled);
	};

	update();

	return {
		update,
		destroy,
	};
};
