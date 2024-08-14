import { registerAnchor } from './deleteAnchor';

type T = keyof HTMLElementTagNameMap;

export const createAnchor: {
	(id: string, tag?: T): T extends undefined ? HTMLElementTagNameMap['div'] : HTMLElementTagNameMap[T];
} = (id: string, tag = 'div') => {
	const anchor = document.getElementById(id);
	if (anchor && anchor.tagName.toLowerCase() === tag) {
		return anchor as any;
	}
	const a = document.createElement(tag);
	a.id = id;
	document.body.appendChild(a);

	registerAnchor(a, () => document.body.removeChild(a));
	return a;
};
