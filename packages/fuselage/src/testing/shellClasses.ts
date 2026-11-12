import { classContract } from './classContract';

const FROZEN =
	/^(rcx-(sidebar|sidepanel|navbar)[\w-]*|rcx-item|rcx-item__link|rcx-item-group|rcx-item-group-header|rcx-item-group-title|rcx-item__actions--reveal-hover)$/;

/**
 * `classContract` restricted to the classes that app code, e2e tests and custom CSS reach the shell by: the `rcx-sidebar*`,
 * `rcx-sidepanel*` and `rcx-navbar*` classes and the few `rcx-item*` ones the keyboard hooks query. Other `rcx-item--*` modifiers
 * are the Item family's own contract and stay out.
 */
export const shellClasses = (root: Element) =>
	classContract(root)
		.split('\n')
		.map((line) => {
			const [path, classes] = line.split(': ');
			const kept = classes
				.split(' ')
				.filter((name) => FROZEN.test(name))
				.sort();
			return kept.length ? `${path}: ${kept.join(' ')}` : null;
		})
		.filter(Boolean)
		.join('\n');
