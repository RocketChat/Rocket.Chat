import { emoji } from '../../../app/emoji/client';

export const detectEmoji = (text: string): { name: string; className: string; image?: string; content: string }[] => {
	const html = Object.values(emoji.packages)
		.reverse()
		.reduce((html, { render }) => render(html), text);
	const div = document.createElement('div');
	div.innerHTML = html;
	return Array.from(div.querySelectorAll('span')).map((span) => ({
		name: span.title,
		className: span.className,
		image: span.style.backgroundImage || undefined,
		content: span.innerText,
	}));
};
