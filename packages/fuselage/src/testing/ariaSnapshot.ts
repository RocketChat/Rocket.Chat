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
	number: 'spinbutton',
	radio: 'radio',
	range: 'slider',
	reset: 'button',
	search: 'searchbox',
	submit: 'button',
};

const roleOf = (element: Element) => {
	const explicit = element.getAttribute('role')?.split(/\s+/)[0];
	if (explicit) return explicit === 'presentation' || explicit === 'none' ? null : explicit;
	const tag = element.tagName.toLowerCase();
	if (tag === 'a') return element.hasAttribute('href') ? 'link' : null;
	if (tag === 'select') {
		const { multiple, size } = element as HTMLSelectElement;
		return multiple || size > 1 ? 'listbox' : 'combobox';
	}
	if (tag === 'input') {
		const { type } = element as HTMLInputElement;
		return type === 'hidden' ? null : (INPUT_ROLES[type] ?? 'textbox');
	}
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

const levelOf = (element: Element) => element.getAttribute('aria-level') ?? /^h([1-6])$/i.exec(element.tagName)?.[1];

const isHidden = (element: Element) => {
	if (['style', 'script', 'template'].includes(element.tagName.toLowerCase())) return true;
	if (element.getAttribute('aria-hidden') === 'true' || (element as HTMLElement).hidden) return true;
	const { display, visibility } = getComputedStyle(element);
	return display === 'none' || visibility === 'hidden';
};

const TEXT_LINE = /^\s*- text: (".*")$/;

const lines = (node: Node, depth: number): string[] => {
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent?.trim();
		return text ? [`${'  '.repeat(depth)}- text: ${JSON.stringify(text)}`] : [];
	}
	if (!(node instanceof Element) || isHidden(node)) return [];

	const role = roleOf(node);
	const name = role ? computeAccessibleName(node) : '';
	// A name taken from the content is already the text of the children
	const namedByContent = name && !node.hasAttribute('aria-label') && !node.hasAttribute('aria-labelledby');
	const children = [...node.childNodes]
		.flatMap((child) => lines(child, role ? depth + 1 : depth))
		.filter((line) => {
			const text = TEXT_LINE.exec(line);
			return !namedByContent || !text || !name.includes(JSON.parse(text[1]));
		});
	if (!role) return children;

	const level = role === 'heading' ? levelOf(node) : undefined;
	const label = [role, name && JSON.stringify(name), level && `[level=${level}]`, ...statesOf(node).map((state) => `[${state}]`)]
		.filter(Boolean)
		.join(' ');
	return [`${'  '.repeat(depth)}- ${label}${children.length ? ':' : ''}`, ...children];
};

/**
 * The accessibility tree under `root` as a stable string, one node per line in the shape of Playwright's `ariaSnapshot()`:
 * role, accessible name, heading level and states. It walks the DOM, so it runs in jsdom and in the browser alike; compare it
 * to a literal. Only the roles mapped in this file are modelled and any other element is transparent, so a spec that must
 * notice a landmark or a form role needs an explicit `role` on it.
 */
export const ariaSnapshot = (root: Element) => [...root.childNodes].flatMap((child) => lines(child, 0)).join('\n');
