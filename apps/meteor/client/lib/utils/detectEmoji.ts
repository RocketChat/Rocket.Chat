import { emoji } from '../../../app/emoji/client';

export const detectEmoji = (text: string): { name: string; className: string; image?: string; content: string }[] => {
	const html = Object.values(emoji.packages)
		.reverse()
		.reduce((html, { render }) => render(html), text);
	const div = document.createElement('div');
	div.innerHTML = html;
	return Array.from(div.querySelectorAll('span, img')).map((element) => {
		const backgroundImage = element instanceof HTMLElement ? element.style.backgroundImage : '';
		const sourceImage = element.getAttribute('src');

		return {
			name: element.getAttribute('title') || '',
			className: element.tagName === 'IMG' ? '' : element.className,
			image: backgroundImage || (sourceImage ? `url("${sourceImage}")` : undefined),
			content: element.textContent || element.getAttribute('alt') || '',
		};
	});
};
