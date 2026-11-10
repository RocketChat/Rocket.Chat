import { computeAccessibleName } from 'dom-accessibility-api';

const TAG_ROLES: Record<string, string> = {
	article: 'article',
	button: 'button',
	dialog: 'dialog',
	form: 'form',
	h1: 'heading',
	h2: 'heading',
	h3: 'heading',
	h4: 'heading',
	h5: 'heading',
	h6: 'heading',
	img: 'img',
	li: 'listitem',
	main: 'main',
	nav: 'navigation',
	ol: 'list',
	option: 'option',
	select: 'combobox',
	table: 'table',
	td: 'cell',
	textarea: 'textbox',
	th: 'columnheader',
	tr: 'row',
	ul: 'list',
};

const INPUT_ROLES: Record<string, string> = {
	button: 'button',
	checkbox: 'checkbox',
	radio: 'radio',
	range: 'slider',
	reset: 'button',
	search: 'searchbox',
	submit: 'button',
};

const roleOf = (element: Element) => {
	const explicit = element.getAttribute('role')?.split(/\s+/)[0];
	if (explicit) return explicit;
	const tag = element.tagName.toLowerCase();
	if (tag === 'a') return element.hasAttribute('href') ? 'link' : null;
	if (tag === 'input') return INPUT_ROLES[(element as HTMLInputElement).type] ?? 'textbox';
	return TAG_ROLES[tag] ?? null;
};

const STATES = ['checked', 'disabled', 'expanded', 'pressed', 'selected', 'busy', 'invalid', 'required', 'current', 'haspopup'];

const statesOf = (element: Element) => {
	const states = STATES.filter((name) => element.hasAttribute(`aria-${name}`)).map((name) => {
		const value = element.getAttribute(`aria-${name}`);
		return value === 'true' || value === '' ? name : `${name}=${value}`;
	});
	if ((element as HTMLButtonElement).disabled && !states.includes('disabled')) states.push('disabled');
	if ((element as HTMLInputElement).checked && !states.includes('checked')) states.push('checked');
	return states.sort();
};

const isHidden = (element: Element) =>
	['style', 'script', 'template'].includes(element.tagName.toLowerCase()) ||
	element.getAttribute('aria-hidden') === 'true' ||
	(element as HTMLElement).hidden;

const lines = (node: Node, depth: number): string[] => {
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent?.trim();
		return text ? [`${'  '.repeat(depth)}- text: ${JSON.stringify(text)}`] : [];
	}
	if (!(node instanceof Element) || isHidden(node)) return [];

	const role = roleOf(node);
	const name = role ? computeAccessibleName(node) : '';
	const children = [...node.childNodes]
		.flatMap((child) => lines(child, role ? depth + 1 : depth))
		.filter((line) => !name || !line.endsWith(`- text: ${JSON.stringify(name)}`));
	if (!role) return children;

	const label = [role, name && JSON.stringify(name), ...statesOf(node).map((state) => `[${state}]`)].filter(Boolean).join(' ');
	return [`${'  '.repeat(depth)}- ${label}${children.length ? ':' : ''}`, ...children];
};

/**
 * The accessibility tree under `root` as a stable string, one node per line in the shape of Playwright's `ariaSnapshot()`:
 * role, accessible name and states. It walks the DOM, so it runs in jsdom and in the browser alike; compare it to a literal.
 */
export const ariaSnapshot = (root: Element) => [...root.childNodes].flatMap((child) => lines(child, 0)).join('\n');
