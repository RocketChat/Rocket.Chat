import type { TodoItem } from './types';
import { isSimilar } from './similarity';

/**
 * Clusters TODOs that describe the same work so they become a single issue.
 *
 * Titles are compared first by exact equality and then by similarity, so two
 * freshly added TODOs written slightly differently still end up in one group.
 * The first TODO of a group (in diff order) defines the canonical title.
 */
export function groupTodos(todos: TodoItem[]): TodoItem[][] {
	const groups: { title: string; todos: TodoItem[] }[] = [];

	for (const todo of todos) {
		const group = groups.find((g) => g.title === todo.title) ?? groups.find((g) => isSimilar(g.title, todo.title));

		if (group) {
			group.todos.push(todo);
			continue;
		}

		groups.push({ title: todo.title, todos: [todo] });
	}

	return groups.map((g) => g.todos);
}
