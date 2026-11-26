import { classContract } from './classContract';

const SHELL =
	/^(rcx-(sidebar|sidepanel|navbar)[\w-]*|rcx-item|rcx-item__link|rcx-item-group|rcx-item-group-header|rcx-item-group-title|rcx-item__actions--reveal-hover)$/;

/**
 * `classContract` restricted to the classes that app code and e2e tests reach the shell by: the `rcx-sidebar*`,
 * `rcx-sidepanel*` and `rcx-navbar*` classes and the few `rcx-item*` ones the keyboard hooks query. Like `classContract`, it is
 * an internal regression net, not a public contract. Other `rcx-item--*` modifiers belong to the Item family's specs and stay out.
 */
export const shellClasses = (root: Element) =>
	classContract(root)
		.split('\n')
		.map((line) => {
			const [path, classes] = line.split(': ');
			const kept = classes
				.split(' ')
				.filter((name) => SHELL.test(name))
				.sort();
			return kept.length ? `${path}: ${kept.join(' ')}` : null;
		})
		.filter(Boolean)
		.join('\n');
